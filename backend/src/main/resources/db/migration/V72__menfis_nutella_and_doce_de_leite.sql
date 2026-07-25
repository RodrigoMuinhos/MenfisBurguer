update products
set name = 'Menfi''s Nutella',
    description = 'Pão brioche amanteigado com marshmallow, pedaços de chocolate e Nutella.',
    image_url = '/buffetdoce/paonuella.jpeg',
    updated_at = now()
where id = 'smash-nutella-marshmallow';

update pricing_products
set code = 'MENFIS-NUTELLA',
    name = 'Menfi''s Nutella',
    notes = 'Pão brioche amanteigado com marshmallow, pedaços de chocolate e Nutella.',
    image_url = '/buffetdoce/paonuella.jpeg',
    updated_at = now()
where id = 'smash-nutella-marshmallow';

insert into products (
  id, name, description, base_price, active, image_url, updated_at
)
values (
  'menfis-doce-de-leite',
  'Menfi''s Doce de Leite',
  'Pão brioche amanteigado com doce de leite cremoso e marshmallows maçaricados.',
  23.90,
  true,
  '/buffetdoce/docedeleite.jpeg',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();

insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  notes, test_mode, image_url, original_price, updated_at
)
values (
  'menfis-doce-de-leite',
  'MENFIS-DOCE-LEITE',
  'Menfi''s Doce de Leite',
  'Sweet',
  'side',
  7.20,
  0,
  0,
  0,
  0,
  23.90,
  0.35,
  true,
  'Pão brioche amanteigado com doce de leite cremoso e marshmallows maçaricados.',
  false,
  '/buffetdoce/docedeleite.jpeg',
  null,
  now()
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  base_cost = excluded.base_cost,
  sale_price = excluded.sale_price,
  target_cmv = excluded.target_cmv,
  active = true,
  notes = excluded.notes,
  image_url = excluded.image_url,
  updated_at = now();
