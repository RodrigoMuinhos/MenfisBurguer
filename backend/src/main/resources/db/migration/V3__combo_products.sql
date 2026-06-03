insert into products (id, name, description, base_price, active)
values
  ('burger', 'Menfi''s Burger', 'Pão brioche, burger 100g, queijo, alface, cebola caramelizada e molho Menfi''s', 23.90, true),
  ('double-burger', 'Double Menfi''s', 'Menfi''s Burger com dois burgers', 33.90, true),
  ('combo', 'Menfi''s Combo', 'Menfi''s Burger, Coca-Cola 350ml e batata frita 250g', 37.90, true),
  ('double-combo', 'Double Menfi''s Combo', 'Double Menfi''s, Coca-Cola 350ml e batata frita 250g', 46.90, true),
  ('combo2', 'Super Combo', '2 burgers, 2 Coca-Cola 350ml e batata frita', 64.90, true),
  ('combo-upgrade', 'Combo batata + Coca-Cola', 'Adicional com batata frita 250g e Coca-Cola 350ml', 14.00, true),
  ('batata', 'Batata Frita 250g', 'Porção de batata frita', 15.90, true),
  ('cola', 'Coca-Cola 350ml', 'Refrigerante lata', 7.90, true),
  ('extra-queijo', 'Extra Queijo', 'Camada extra de queijo', 2.00, true),
  ('extra-ovo', 'Ovo', 'Ovo adicional', 2.50, true),
  ('extra-molho', 'Molho Extra', 'Porção extra do molho Menfi''s', 2.90, true)
on conflict (id) do update set name = excluded.name, description = excluded.description, base_price = excluded.base_price, active = excluded.active;

insert into inventory_items (id, name, unit, quantity, min_quantity)
values ('ovo', 'Ovo', 'un', 80, 15)
on conflict (id) do update set name = excluded.name, unit = excluded.unit, min_quantity = excluded.min_quantity;

insert into product_ingredients (product_id, inventory_item_id, quantity)
select product_id, inventory_item_id, quantity
from (
  values
    ('combo', 'pao-brioche', 1),
    ('combo', 'carne-70-30', 0.1),
    ('combo', 'queijo', 1),
    ('combo', 'alface', 0.5),
    ('combo', 'molho', 30),
    ('combo', 'batata', 0.25),
    ('combo', 'coca-cola', 1),
    ('double-combo', 'pao-brioche', 1),
    ('double-combo', 'carne-70-30', 0.2),
    ('double-combo', 'queijo', 2),
    ('double-combo', 'alface', 0.5),
    ('double-combo', 'molho', 40),
    ('double-combo', 'batata', 0.25),
    ('double-combo', 'coca-cola', 1),
    ('combo2', 'pao-brioche', 2),
    ('combo2', 'carne-70-30', 0.2),
    ('combo2', 'queijo', 2),
    ('combo2', 'alface', 1),
    ('combo2', 'molho', 60),
    ('combo2', 'batata', 0.25),
    ('combo2', 'coca-cola', 2),
    ('combo-upgrade', 'batata', 0.25),
    ('combo-upgrade', 'coca-cola', 1),
    ('extra-queijo', 'queijo', 1),
    ('extra-ovo', 'ovo', 1),
    ('extra-molho', 'molho', 20)
) as seed(product_id, inventory_item_id, quantity)
where not exists (
  select 1 from product_ingredients pi
  where pi.product_id = seed.product_id and pi.inventory_item_id = seed.inventory_item_id
);
