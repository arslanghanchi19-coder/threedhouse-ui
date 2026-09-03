-- PostgreSQL only. Apply ONCE in Supabase SQL Editor after reviewing/backing up.
-- Creates new prefixed tables; never drops or overwrites existing store data.
begin;

create table public.tdh_products (
  id bigint primary key,
  name text not null,
  category text not null,
  price integer not null check (price between 1 and 1000000),
  stock integer not null default 0 check (stock >= 0),
  material text not null default 'PETG',
  color text not null default '',
  description text not null default '',
  "imageKey" text,
  "imageKeys" jsonb not null default '[]'::jsonb
);
create table public.tdh_categories (name text primary key, "imageKey" text);
create table public.tdh_orders (
  id uuid primary key default gen_random_uuid(),
  "requestId" uuid not null,
  "userId" uuid not null references auth.users(id),
  "createdAt" timestamptz not null default now(),
  "customerName" text not null,
  phone text not null, email text not null default '',
  address text not null, city text not null, state text not null, pincode text not null,
  "paymentMethod" text not null default 'cod' check ("paymentMethod" = 'cod'),
  "paymentStatus" text not null default 'pending',
  "orderStatus" text not null default 'new',
  courier text not null default '', "trackingNumber" text not null default '',
  "trackingUrl" text not null default '', "ownerNote" text not null default '',
  subtotal bigint not null, shipping integer not null, total bigint not null,
  items jsonb not null,
  unique ("userId", "requestId")
);
create index tdh_orders_user_created on public.tdh_orders("userId", "createdAt" desc);
create table public.tdh_quotes (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references auth.users(id),
  "createdAt" timestamptz not null default now(),
  "customerName" text not null, phone text not null, email text not null default '',
  "projectType" text not null, description text not null,
  quantity integer not null check (quantity > 0),
  status text not null default 'new', "ownerNote" text not null default ''
);

-- The browser has no direct table access. Server routes verify user/owner before
-- service-role access. Customers can only read their own orders through the API.
alter table public.tdh_products enable row level security;
alter table public.tdh_categories enable row level security;
alter table public.tdh_orders enable row level security;
alter table public.tdh_quotes enable row level security;
revoke all on public.tdh_products, public.tdh_categories, public.tdh_orders, public.tdh_quotes from anon, authenticated;
grant select, insert, update, delete on public.tdh_products, public.tdh_categories, public.tdh_orders, public.tdh_quotes to service_role;

-- Price, stock checks, inventory decrement and order creation are one transaction.
-- Repeated submissions with the same user/request UUID return the same order.
create function public.tdh_place_cod_order(p_user_id uuid, p_request_id uuid, p_delivery jsonb, p_items jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_existing public.tdh_orders%rowtype;
  v_product public.tdh_products%rowtype;
  v_item jsonb;
  v_group record;
  v_color text;
  v_quantity integer;
  v_items jsonb := '[]'::jsonb;
  v_subtotal bigint := 0;
  v_shipping integer;
  v_id uuid;
begin
  if p_user_id is null or p_request_id is null then raise exception 'Checkout: Please sign in.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select * into v_existing from public.tdh_orders where "userId"=p_user_id and "requestId"=p_request_id;
  if found then return jsonb_build_object('id',v_existing.id,'total',v_existing.total,'paymentMethod','cod'); end if;
  if (select count(*) from public.tdh_orders where "userId"=p_user_id and "createdAt">now()-interval '1 hour') >= 10 then
    raise exception 'Checkout: Too many orders. Please try again later.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Checkout: Invalid cart.';
  end if;
  if coalesce(p_delivery->>'phone','') !~ '^[0-9]{10}$' or coalesce(p_delivery->>'pincode','') !~ '^[0-9]{6}$'
    or length(coalesce(p_delivery->>'customerName',''))<2 or length(coalesce(p_delivery->>'address',''))<5
    or length(coalesce(p_delivery->>'city',''))<1 or length(coalesce(p_delivery->>'state',''))<1 then
    raise exception 'Checkout: Complete the delivery details.';
  end if;
  -- Lock in stable product order to avoid deadlocks across concurrent carts.
  perform id from public.tdh_products where id in (
    select (value->>'productId')::bigint from jsonb_array_elements(p_items)
  ) order by id for update;
  for v_group in select (value->>'productId')::bigint as id, sum((value->>'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) group by (value->>'productId')::bigint
  loop
    select * into v_product from public.tdh_products where id=v_group.id;
    if not found then raise exception 'Checkout: A product is no longer available.'; end if;
    if v_group.quantity is null or v_group.quantity<1 or v_group.quantity>v_product.stock then
      raise exception 'Checkout: Not enough stock. Please update your cart.';
    end if;
  end loop;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity not between 1 and 100 then raise exception 'Checkout: Invalid quantity.'; end if;
    select * into strict v_product from public.tdh_products where id=(v_item->>'productId')::bigint;
    v_color := coalesce(v_item->>'color','Standard');
    if trim(v_product.color)<>'' and not exists (
      select 1 from unnest(string_to_array(v_product.color,',')) as c(value) where trim(c.value)=v_color
    ) then raise exception 'Checkout: Select an available colour.'; end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object('productId',v_product.id,'name',v_product.name,
      'price',v_product.price,'quantity',v_quantity,'color',v_color,'imageKey',v_product."imageKey"));
    v_subtotal := v_subtotal + v_product.price::bigint*v_quantity;
  end loop;
  v_shipping := case when v_subtotal>=500 then 0 else 99 end;
  update public.tdh_products p set stock=p.stock-q.quantity from (
    select (value->>'productId')::bigint as id, sum((value->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) group by (value->>'productId')::bigint
  ) q where p.id=q.id;
  insert into public.tdh_orders ("userId","requestId","customerName",phone,email,address,city,state,pincode,subtotal,shipping,total,items)
  values(p_user_id,p_request_id,p_delivery->>'customerName',p_delivery->>'phone',coalesce(p_delivery->>'email',''),
    p_delivery->>'address',p_delivery->>'city',p_delivery->>'state',p_delivery->>'pincode',v_subtotal,v_shipping,v_subtotal+v_shipping,v_items)
  returning id into v_id;
  return jsonb_build_object('id',v_id,'total',v_subtotal+v_shipping,'paymentMethod','cod');
end;
$$;
revoke all on function public.tdh_place_cod_order(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.tdh_place_cod_order(uuid,uuid,jsonb,jsonb) to service_role;
commit;
