update products
set
  name = 'Maionse Grill',
  description = 'Porção extra de Maionse Grill',
  updated_at = now()
where id = 'extra-maionese-barbecue';

update addons
set name = 'Maionse Grill'
where id = 'extra-maionese-barbecue';

update pricing_products
set
  name = 'Maionse Grill',
  code = 'MAIONSE-GRILL',
  updated_at = now()
where id = 'extra-maionese-barbecue';
