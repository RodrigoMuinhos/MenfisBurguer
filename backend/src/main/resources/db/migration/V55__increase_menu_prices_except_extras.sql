update pricing_products
set sale_price = sale_price + 2.00,
    updated_at = now()
where lower(trim(category)) not in ('adicional', 'bebida');

update products p
set base_price = p.base_price + 2.00,
    updated_at = now()
where exists (
  select 1
  from pricing_products pp
  where pp.id = p.id
    and lower(trim(pp.category)) not in ('adicional', 'bebida')
);
