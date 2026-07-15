update products
set name = 'Smoore',
    description = 'Pao brioche amanteigado com marshmallow, pedacos de chocolate e Nutella.',
    updated_at = now()
where id = 'smash-nutella-marshmallow';

update pricing_products
set code = 'SMOORE',
    name = 'Smoore',
    category = 'SUPER',
    notes = 'Pao brioche amanteigado com marshmallow, pedacos de chocolate e Nutella.',
    updated_at = now()
where id = 'smash-nutella-marshmallow';

insert into products (id, name, description, base_price, active, image_url, updated_at)
values
  (
    'tropikal-menfis',
    'Tropikal Menfi''s',
    'Pao brioche 65g, blend bovino 130g, abacaxi temperado e grelhado, queijo coalho grelhado 50g e salada Tropikal com alface, cebola roxa e cebolinha.',
    42.90,
    true,
    '/super/tropikal.jpeg',
    now()
  ),
  (
    'tropikal-barbecue',
    'Tropikal Barbecue',
    'Pao brioche 65g, blend bovino 130g, geleia de bacon, cheddar, molho barbecue com alho frito e maionese Grill. Ardencia obrigatoria de 0 a 5.',
    42.90,
    true,
    '/super/Chilli.jpeg',
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
values
  (
    'tropikal-menfis', 'TROPIKAL-MENFIS', 'Tropikal Menfi''s', 'SUPER', 'sandwich',
    0, 0, 0, 0, 0, 42.90, 0.35, true,
    'Pao brioche 65g, blend bovino 130g, abacaxi grelhado, queijo coalho 50g, alface, cebola roxa e cebolinha.',
    false, '/super/tropikal.jpeg', null, now()
  ),
  (
    'tropikal-barbecue', 'TROPIKAL-BBQ', 'Tropikal Barbecue', 'SUPER', 'sandwich',
    0, 0, 0, 0, 0, 42.90, 0.35, true,
    'Pao brioche 65g, blend bovino 130g, geleia de bacon, cheddar, barbecue com alho frito e maionese Grill. Escolha a pimenta de 0 a 5.',
    false, '/super/Chilli.jpeg', null, now()
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
