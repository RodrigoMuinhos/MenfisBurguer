insert into products (id, name, description, base_price, active, image_url, updated_at)
values (
  'triple-combo',
  'Combo Triple Menfi''s',
  'Burger com 3 carnes suculentas de 100g, cheddar derretido, salada, molho Menfi''s, batata e bebida gelada.',
  65.90,
  true,
  '/menu/supercombomnfis.png',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = excluded.active,
  image_url = excluded.image_url,
  updated_at = now();

insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  notes, test_mode, image_url, original_price, updated_at
)
values (
  'triple-combo',
  'TRIPLE-MENFIS',
  'Combo Triple Menfi''s',
  'Combo',
  'combo',
  17.70,
  3.70,
  2.89,
  3.89,
  2.00,
  65.90,
  0.35,
  true,
  '3 carnes de 100g, cheddar, salada, molho Menfi''s, batata e bebida gelada.',
  false,
  '/menu/supercombomnfis.png',
  79.90,
  now()
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  base_cost = excluded.base_cost,
  fries_cost = excluded.fries_cost,
  default_drink_cost = excluded.default_drink_cost,
  alternative_drink_cost = excluded.alternative_drink_cost,
  drink_surcharge = excluded.drink_surcharge,
  sale_price = excluded.sale_price,
  target_cmv = excluded.target_cmv,
  active = excluded.active,
  notes = excluded.notes,
  image_url = excluded.image_url,
  original_price = excluded.original_price,
  updated_at = now();

delete from product_ingredients
where product_id = 'triple-combo';

insert into product_ingredients (product_id, inventory_item_id, quantity)
values
  ('triple-combo', 'pao-brioche', 1),
  ('triple-combo', 'carne-70-30', 0.30),
  ('triple-combo', 'queijo', 3),
  ('triple-combo', 'alface', 0.5),
  ('triple-combo', 'molho', 30),
  ('triple-combo', 'batata', 0.25),
  ('triple-combo', 'coca-cola', 1);

insert into app_settings(key, value, updated_at)
values (
  'special_offer_settings',
  '{"enabled":false,"oncePerSession":true,"productId":"triple-combo","title":"Combo Triple Menfi''s — O Matador de Fome","description":"3 carnes suculentas, cheddar derretido, salada, molho Menfi''s e muito capricho. Um combo pesado, feito para quem chega com fome de verdade.","image":"/menu/supercombomnfis.png","price":65.9,"primaryButton":"Adicionar ao pedido","secondaryButton":"Ver cardápio"}',
  now()
)
on conflict (key) do nothing;

update app_settings
set value = replace(value, '"productId":"combo2"', '"productId":"triple-combo"'),
    updated_at = now()
where key = 'special_offer_settings'
  and value like '%"productId":"combo2"%';
