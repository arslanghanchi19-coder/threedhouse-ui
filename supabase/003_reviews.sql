-- PostgreSQL only. Apply ONCE in Supabase SQL Editor after reviewing/backing up.
-- Adds product reviews. Never drops or overwrites existing store data.
begin;

create table public.tdh_reviews (
  id uuid primary key default gen_random_uuid(),
  "productId" bigint not null references public.tdh_products(id) on delete cascade,
  "userId" uuid not null references auth.users(id),
  "customerName" text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  "createdAt" timestamptz not null default now(),
  unique ("productId", "userId")
);
create index tdh_reviews_product on public.tdh_reviews("productId", "createdAt" desc);

-- Same access model as the rest of the store: no direct browser access,
-- server routes use the service role after verifying the signed-in user.
alter table public.tdh_reviews enable row level security;
revoke all on public.tdh_reviews from anon, authenticated;
grant select, insert, update, delete on public.tdh_reviews to service_role;

commit;
