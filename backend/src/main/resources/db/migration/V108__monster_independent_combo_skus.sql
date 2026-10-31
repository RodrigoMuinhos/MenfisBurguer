-- Sandwich and sides are separate cashier SKUs, with independently priced quantities.
update products set base_price = 33.90, updated_at = now() where id = 'menfis-monster';
update pricing_products set sale_price = 33.90, original_price = null, updated_at = now() where id = 'menfis-monster';

-- Keep legacy addon requests priced consistently while new clients send standalone products.
update addons set price = 16.90 where id = 'monster-coca-zero-batata';

insert into products (id, name, description, base_price, active, image_url)
values
  ('monster-coca-zero-batata', 'Coca-Cola Zero + batata 150g', 'Adicional combo: uma Coca-Cola Zero e uma batata frita 150g. Sanduíche vendido separadamente.', 16.90, true, '/EXTRAS/cocazero.jpg'),
  ('monster-coca-zero', 'Coca-Cola Zero', 'Coca-Cola Zero avulsa do evento Halloween.', 8.90, true, '/EXTRAS/cocazero.jpg'),
  ('monster-batata-150g', 'Batata frita 150g', 'Batata frita 150g avulsa do evento Halloween.', 16.90, true, '/EXTRAS/batata.jpg');

insert into pricing_products (id, code, name, category, kind, sale_price, active, notes, image_url)
select id,
  case id
    when 'monster-coca-zero-batata' then 'MONSTER-COMBO-ADD'
    when 'monster-coca-zero' then 'MONSTER-COCA-ZERO'
    when 'monster-batata-150g' then 'MONSTER-BATATA150'
  end,
  name, 'Adicional Halloween', 'side', base_price, true, description, image_url
from products where id in ('monster-coca-zero-batata','monster-coca-zero','monster-batata-150g');
