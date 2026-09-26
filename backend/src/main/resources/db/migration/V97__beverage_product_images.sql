update products
set image_url = '/bebidas/' || id || '.png', updated_at = now()
where id in ('monster', 'agua-sem-gas', 'heineken-longneck');

update pricing_products
set image_url = '/bebidas/' || id || '.png', updated_at = now()
where id in ('monster', 'agua-sem-gas', 'heineken-longneck');
