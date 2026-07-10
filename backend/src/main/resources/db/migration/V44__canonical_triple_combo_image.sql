update products
set image_url = '/menu/supercombomnfis.png',
    updated_at = now()
where id = 'triple-combo';

update pricing_products
set image_url = '/menu/supercombomnfis.png',
    updated_at = now()
where id = 'triple-combo';

update app_settings
set value = jsonb_set(value::jsonb, '{image}', to_jsonb('/menu/supercombomnfis.png'::text))::text,
    updated_at = now()
where key = 'special_offer_settings';

update app_settings
set value = replace(value, '/ads/ctm.jpeg', '/menu/supercombomnfis.png'),
    updated_at = now()
where value like '%/ads/ctm.jpeg%';
