with menu(id, name, category, kind, sale_price, original_price, image_url, code) as (
  values
    ('burger', 'Menfi''s Burger', 'Sanduiche', 'sandwich', 21.90, 25.90, '/menu/menfisburguer.png', 'MENFIS'),
    ('double-burger', 'BIG Menfi''s', 'Sanduiche', 'sandwich', 29.90, 39.90, '/menu/Double menfis.png', 'BIG-MENFIS'),
    ('menfis-chicken', 'Menfi''s Chicken', 'Sanduiche', 'sandwich', 24.90, 29.90, '/menu/CHICKEN.png', 'CHICKEN'),
    ('double-menfis-chicken', 'BIG Menfi''s Chicken', 'Sanduiche', 'sandwich', 32.90, 45.90, '/menu/DOUBLECHICKEN.png', 'BIG-CHICKEN'),
    ('menfis-bacon', 'Menfi''s Bacon', 'Sanduiche', 'sandwich', 27.90, 34.90, '/menu/BACON.png', 'BACON'),
    ('double-menfis-bacon', 'BIG Menfi''s Bacon', 'Sanduiche', 'sandwich', 35.90, 47.90, '/menu/DOUBLEBACON.png', 'BIG-BACON'),
    ('combo', 'Combo Menfi''s', 'Combo', 'combo', 34.90, 44.90, '/menu/combomenfis.png', 'COMBO-MENFIS'),
    ('double-combo', 'Combo BIG Menfi''s', 'Combo', 'combo', 42.90, 58.90, '/menu/combodoublemenfi.png', 'COMBO-BIG'),
    ('combo2', 'Super Combo Menfi''s', 'Combo', 'combo', 59.90, 79.90, '/menu/supercombomnfis.png', 'SUPER-MENFIS'),
    ('chicken-combo', 'Combo Menfi''s Chicken', 'Combo', 'combo', 38.90, 51.90, '/menu/COMBOCHICKEN.png', 'COMBO-CHICKEN'),
    ('double-chicken-combo', 'Combo BIG Menfi''s Chicken', 'Combo', 'combo', 46.90, 66.90, '/menu/COMBODOUBLECHICKEN.png', 'COMBO-BIG-CHICKEN'),
    ('chicken-super-combo', 'Super Combo Menfi''s Chicken', 'Combo', 'combo', 64.90, 86.90, '/menu/SUPERCOMBOCHICKEN.png', 'SUPER-CHICKEN'),
    ('bacon-combo', 'Combo Menfi''s Bacon', 'Combo', 'combo', 40.90, 54.90, '/menu/BACONCOMBO.png', 'COMBO-BACON'),
    ('double-bacon-combo', 'Combo BIG Menfi''s Bacon', 'Combo', 'combo', 48.90, 69.90, '/menu/DOUBLEBACONCOMBO.png', 'COMBO-BIG-BACON'),
    ('bacon-super-combo', 'Super Combo Menfi''s Bacon', 'Combo', 'combo', 71.90, 108.90, '/menu/SUPERCOMBOBACON.png', 'SUPER-BACON'),
    ('batata', 'Batata Frita', 'Acompanhamento', 'side', 19.90, null, '/EXTRAS/batata.jpg', 'BATATA'),
    ('extra-carne', 'Adicional de Carne', 'Adicional', 'side', 9.90, null, '/carne.jpg', 'EXTRA-CARNE'),
    ('extra-frango', 'Adicional de Frango', 'Adicional', 'side', 9.90, null, '/AdicionalFrango.jpg', 'EXTRA-FRANGO'),
    ('extra-queijo', 'Extra Queijo', 'Adicional', 'side', 2.00, null, '/queijo.jpg', 'EXTRA-QUEIJO'),
    ('extra-ovo', 'Ovo', 'Adicional', 'side', 2.50, null, '/ovo.jpg', 'EXTRA-OVO'),
    ('extra-maionese-barbecue', 'Maionse Grill', 'Adicional', 'side', 2.00, null, '/EXTRAS/MaioneseBarbecue.jpg', 'MAIONSE-GRILL'),
    ('extra-maionese-alho-frito', 'Maionese Alho Frito', 'Adicional', 'side', 2.00, null, '/EXTRAS/MaionseAlhoFrito.jpg', 'MAIONESE-ALHO'),
    ('coca-zero', 'Coca-Cola Zero', 'Bebida', 'drink', 8.90, null, '/EXTRAS/cocazero.jpg', 'COCA'),
    ('guarana-zero', 'Guarana Zero', 'Bebida', 'drink', 6.90, null, '/EXTRAS/Gurarana.jpg', 'GUARANA'),
    ('agua-com-gas', 'Agua com gas', 'Bebida', 'drink', 5.90, null, '/EXTRAS/aguaComGas.png', 'AGUA-GAS')
)
insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  test_mode, image_url, original_price, updated_at
)
select
  menu.id,
  menu.code,
  menu.name,
  menu.category,
  menu.kind,
  coalesce(existing.base_cost, 0),
  coalesce(existing.fries_cost, 0),
  coalesce(existing.default_drink_cost, 0),
  coalesce(existing.alternative_drink_cost, 0),
  coalesce(existing.drink_surcharge, 0),
  menu.sale_price,
  coalesce(nullif(existing.target_cmv, 0), 0.35),
  true,
  false,
  menu.image_url,
  menu.original_price,
  now()
from menu
left join pricing_products existing on existing.id = menu.id and existing.test_mode = false
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  sale_price = excluded.sale_price,
  active = true,
  image_url = excluded.image_url,
  original_price = excluded.original_price,
  updated_at = now();

with menu(id, name, sale_price, image_url) as (
  values
    ('burger', 'Menfi''s Burger', 21.90, '/menu/menfisburguer.png'),
    ('double-burger', 'BIG Menfi''s', 29.90, '/menu/Double menfis.png'),
    ('menfis-chicken', 'Menfi''s Chicken', 24.90, '/menu/CHICKEN.png'),
    ('double-menfis-chicken', 'BIG Menfi''s Chicken', 32.90, '/menu/DOUBLECHICKEN.png'),
    ('menfis-bacon', 'Menfi''s Bacon', 27.90, '/menu/BACON.png'),
    ('double-menfis-bacon', 'BIG Menfi''s Bacon', 35.90, '/menu/DOUBLEBACON.png'),
    ('combo', 'Combo Menfi''s', 34.90, '/menu/combomenfis.png'),
    ('double-combo', 'Combo BIG Menfi''s', 42.90, '/menu/combodoublemenfi.png'),
    ('combo2', 'Super Combo Menfi''s', 59.90, '/menu/supercombomnfis.png'),
    ('chicken-combo', 'Combo Menfi''s Chicken', 38.90, '/menu/COMBOCHICKEN.png'),
    ('double-chicken-combo', 'Combo BIG Menfi''s Chicken', 46.90, '/menu/COMBODOUBLECHICKEN.png'),
    ('chicken-super-combo', 'Super Combo Menfi''s Chicken', 64.90, '/menu/SUPERCOMBOCHICKEN.png'),
    ('bacon-combo', 'Combo Menfi''s Bacon', 40.90, '/menu/BACONCOMBO.png'),
    ('double-bacon-combo', 'Combo BIG Menfi''s Bacon', 48.90, '/menu/DOUBLEBACONCOMBO.png'),
    ('bacon-super-combo', 'Super Combo Menfi''s Bacon', 71.90, '/menu/SUPERCOMBOBACON.png'),
    ('batata', 'Batata Frita', 19.90, '/EXTRAS/batata.jpg'),
    ('extra-carne', 'Adicional de Carne', 9.90, '/carne.jpg'),
    ('extra-frango', 'Adicional de Frango', 9.90, '/AdicionalFrango.jpg'),
    ('extra-queijo', 'Extra Queijo', 2.00, '/queijo.jpg'),
    ('extra-ovo', 'Ovo', 2.50, '/ovo.jpg'),
    ('extra-maionese-barbecue', 'Maionse Grill', 2.00, '/EXTRAS/MaioneseBarbecue.jpg'),
    ('extra-maionese-alho-frito', 'Maionese Alho Frito', 2.00, '/EXTRAS/MaionseAlhoFrito.jpg'),
    ('coca-zero', 'Coca-Cola Zero', 8.90, '/EXTRAS/cocazero.jpg'),
    ('guarana-zero', 'Guarana Zero', 6.90, '/EXTRAS/Gurarana.jpg'),
    ('agua-com-gas', 'Agua com gas', 5.90, '/EXTRAS/aguaComGas.png')
)
insert into products (id, name, description, base_price, active, image_url, updated_at)
select id, name, name, sale_price, true, image_url, now()
from menu
on conflict (id) do update set
  name = excluded.name,
  base_price = excluded.base_price,
  active = true,
  image_url = excluded.image_url,
  updated_at = now();
