update products
set active = false,
    updated_at = now()
where id = 'monte-sua-caixinha';

update pricing_products
set active = false,
    updated_at = now()
where id = 'monte-sua-caixinha';

insert into products (id, name, description, base_price, active, image_url, updated_at)
values
  (
    'sweet-menfis-classic',
    'Sweet Menfi''s Classic',
    'Caixinha com 4 doces classicos a escolha: brigadeiro, beijinho, cajuzinho e casadinho.',
    8.90,
    true,
    '/sweet.jpg',
    now()
  ),
  (
    'sweet-menfis-plus',
    'Sweet Menfi''s Plus',
    'Caixinha com 4 doces premium a escolha: bala baiana, ninho com Nutella, churros e cafe.',
    8.90,
    true,
    '/sweet.jpg',
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
    'sweet-menfis-classic',
    'SWEET-CLASSIC',
    'Sweet Menfi''s Classic',
    'Sweet / Classic',
    'side',
    3.10,
    0,
    0,
    0,
    0,
    8.90,
    0.35,
    true,
    'Caixinha com 4 doces classicos sem adicional.',
    false,
    '/sweet.jpg',
    null,
    now()
  ),
  (
    'sweet-menfis-plus',
    'SWEET-PLUS',
    'Sweet Menfi''s Plus',
    'Sweet / Plus',
    'side',
    3.10,
    0,
    0,
    0,
    0,
    8.90,
    0.35,
    true,
    'Caixinha base R$ 8,90. Cada doce premium soma R$ 2,90 ao valor final.',
    false,
    '/sweet.jpg',
    null,
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
