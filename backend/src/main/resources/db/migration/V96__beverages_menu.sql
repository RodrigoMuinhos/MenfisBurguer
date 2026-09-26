insert into products (id, name, description, base_price, active, image_url, updated_at)
values
  ('coca-cola', 'Coca-Cola', 'Coca-Cola gelada', 8.90, true, '/EXTRAS/cocacola.png', now()),
  ('coca-zero', 'Coca-Cola Zero', 'Coca-Cola Zero gelada', 8.90, true, '/EXTRAS/cocazero.jpg', now()),
  ('guarana-zero', 'Guaraná Zero', 'Guaraná Zero gelada', 8.90, true, '/EXTRAS/GuraranaZero.jpg', now()),
  ('agua-com-gas', 'Água com gás', 'Água com gás gelada', 4.90, true, '/EXTRAS/aguaComGas.png', now()),
  ('heineken-longneck', 'Heineken Long Neck', 'Heineken Long Neck gelada', 13.90, true, '/logo_M.jpeg', now()),
  ('agua-sem-gas', 'Água sem gás', 'Água sem gás gelada', 4.90, true, '/logo_M.jpeg', now()),
  ('monster', 'Monster', 'Monster gelada', 21.90, true, '/logo_M.jpeg', now())
on conflict (id) do update set
  name = excluded.name, base_price = excluded.base_price, active = true,
  updated_at = now();

insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active,
  test_mode, image_url, original_price, updated_at
)
values
  ('coca-cola', 'COCA-COLA', 'Coca-Cola', 'Bebida', 'drink', 0, 0, 0, 0, 0, 8.90, 0.35, true, false, '/EXTRAS/cocacola.png', null, now()),
  ('coca-zero', 'COCA-ZERO', 'Coca-Cola Zero', 'Bebida', 'drink', 0, 0, 0, 0, 0, 8.90, 0.35, true, false, '/EXTRAS/cocazero.jpg', null, now()),
  ('guarana-zero', 'GUARANA-ZERO', 'Guaraná Zero', 'Bebida', 'drink', 0, 0, 0, 0, 0, 8.90, 0.35, true, false, '/EXTRAS/GuraranaZero.jpg', null, now()),
  ('agua-com-gas', 'AGUA-COM-GAS', 'Água com gás', 'Bebida', 'drink', 0, 0, 0, 0, 0, 4.90, 0.35, true, false, '/EXTRAS/aguaComGas.png', null, now()),
  ('heineken-longneck', 'HEINEKEN-LONGNECK', 'Heineken Long Neck', 'Bebida', 'drink', 0, 0, 0, 0, 0, 13.90, 0.35, true, false, '/logo_M.jpeg', null, now()),
  ('agua-sem-gas', 'AGUA-SEM-GAS', 'Água sem gás', 'Bebida', 'drink', 0, 0, 0, 0, 0, 4.90, 0.35, true, false, '/logo_M.jpeg', null, now()),
  ('monster', 'MONSTER', 'Monster', 'Bebida', 'drink', 0, 0, 0, 0, 0, 21.90, 0.35, true, false, '/logo_M.jpeg', null, now())
on conflict (id) do update set
  name = excluded.name, category = excluded.category, kind = excluded.kind,
  sale_price = excluded.sale_price, active = true, original_price = null,
  updated_at = now();
