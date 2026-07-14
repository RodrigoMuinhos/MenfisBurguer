insert into products (id, name, description, base_price, active, image_url, updated_at)
values (
  'smash-nutella-marshmallow',
  'Smash de Nutella com Marshmallow',
  'Pao brioche amanteigado, recheado com uma generosa camada de Nutella e marshmallows macaricados, criando o equilibrio perfeito entre cremosidade e crocancia.',
  19.90,
  true,
  '/buffetdoce/paonuella.jpeg',
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
  'smash-nutella-marshmallow',
  'SMASH-NUTELLA',
  'Smash de Nutella com Marshmallow',
  'Sweet',
  'side',
  0,
  0,
  0,
  0,
  0,
  19.90,
  0.35,
  true,
  'Pao brioche na manteiga, 50g de Nutella e marshmallows macaricados.',
  false,
  '/buffetdoce/paonuella.jpeg',
  null,
  now()
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  sale_price = excluded.sale_price,
  active = excluded.active,
  notes = excluded.notes,
  image_url = excluded.image_url,
  updated_at = now();
