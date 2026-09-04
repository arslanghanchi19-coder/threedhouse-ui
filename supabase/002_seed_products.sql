-- Run once in the Supabase SQL Editor to add 5 sample products.
-- Safe to run even if other products already exist (ids are computed from the current max).
with base as (select coalesce(max(id),0) as m from public.tdh_products)
insert into public.tdh_products (id,name,category,price,stock,material,color,description)
select base.m+row_number() over (), t.name,t.category,t.price,t.stock,t.material,t.color,t.description
from base, (values
  ('Aurora Wall Planter','Planters & Décor',599,15,'PLA+','Terracotta, Sage, Charcoal','A gently curved wall-mounted planter that brings greenery to any vertical space.'),
  ('Cascade Cable Organizer','Desk & Office',299,30,'PETG','Graphite, White','Keep charging cables tidy and within reach with this channelled desk organiser.'),
  ('Nordic Spice Rack','Kitchen',749,10,'PLA+','Natural, Charcoal','A minimalist tiered rack that keeps spice jars visible and within easy reach.'),
  ('Origami Pen Stand','Desk & Office',349,20,'PLA+','Sand, Stone','A faceted pen and stationery stand inspired by folded paper geometry.'),
  ('Honeycomb Wall Hooks (Set of 3)','Home Organization',449,25,'PETG','Black, White','Modular hexagonal hooks for coats, bags and keys near any entryway.')
) as t(name,category,price,stock,material,color,description);
