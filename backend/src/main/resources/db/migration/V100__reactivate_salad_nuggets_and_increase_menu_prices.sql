-- Restore the current salad and nugget portions; legacy nugget IDs stay retired.
update pricing_products
set active = true, updated_at = now()
where id in ('chicken-menfis-salad', 'nuggets-90g', 'nuggets-180g', 'nuggets-grande');

update products
set active = true, updated_at = now()
where id in ('chicken-menfis-salad', 'nuggets-90g', 'nuggets-180g', 'nuggets-grande');

-- Raise every menu price once through Flyway. Ingredients and addons are separate.
update pricing_products
set sale_price = sale_price + 4.00,
    original_price = case when original_price > 0 then original_price + 4.00 else original_price end,
    updated_at = now();

update products p
set base_price = p.base_price + 4.00, updated_at = now()
where exists (select 1 from pricing_products pp where pp.id = p.id);
