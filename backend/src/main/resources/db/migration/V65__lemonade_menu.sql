with menu(id, name, description, sale_price, image_url, code) as (
  values
    ('pink-lemonade', 'Pink Lemonade', 'Morango, limão e um toque especial de refrescância. Copo 500ml.', 14.90::numeric, '/Lemonade/pink.jpeg', 'PINK-LEMONADE'),
    ('purple-lemonade', 'Purple Lemonade', 'Uva e amora em uma combinação intensa, doce e refrescante. Copo 500ml.', 14.90::numeric, '/Lemonade/purple.jpeg', 'PURPLE-LEMONADE'),
    ('sunset-lemonade', 'Sunset Lemonade', 'Maracujá, manga e morango em uma explosão tropical. Copo 500ml.', 14.90::numeric, '/Lemonade/sunset.jpeg', 'SUNSET-LEMONADE')
)
insert into products (id, name, description, base_price, active, image_url, updated_at)
select id, name, description, sale_price, true, image_url, now()
from menu
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();

with menu(id, name, description, sale_price, image_url, code) as (
  values
    ('pink-lemonade', 'Pink Lemonade', 'Morango, limão e um toque especial de refrescância. Copo 500ml.', 14.90::numeric, '/Lemonade/pink.jpeg', 'PINK-LEMONADE'),
    ('purple-lemonade', 'Purple Lemonade', 'Uva e amora em uma combinação intensa, doce e refrescante. Copo 500ml.', 14.90::numeric, '/Lemonade/purple.jpeg', 'PURPLE-LEMONADE'),
    ('sunset-lemonade', 'Sunset Lemonade', 'Maracujá, manga e morango em uma explosão tropical. Copo 500ml.', 14.90::numeric, '/Lemonade/sunset.jpeg', 'SUNSET-LEMONADE')
)
insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  notes, test_mode, image_url, original_price, updated_at
)
select id, code, name, 'Lemonade', 'drink', 5.00, 0, 0, 0, 0, sale_price, 0.35, true,
  description, false, image_url, null, now()
from menu
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  sale_price = excluded.sale_price,
  active = true,
  notes = excluded.notes,
  image_url = excluded.image_url,
  updated_at = now();
