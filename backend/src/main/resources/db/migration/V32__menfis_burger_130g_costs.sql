update products
set description = case id
  when 'burger' then 'Pao brioche, burger 130g, queijo, alface, cebola caramelizada e molho Menfi''s'
  when 'combo' then 'Menfi''s Burger 130g, refrigerante e batata frita'
  when 'combo2' then '2 Menfi''s Burger 130g, 2 refrigerantes e batata frita'
  else description
end,
updated_at = now()
where id in ('burger', 'combo', 'combo2');

update pricing_products
set base_cost = case id
  when 'burger' then 8.85
  when 'combo' then 8.85
  when 'combo2' then 17.70
  else base_cost
end,
updated_at = now()
where id in ('burger', 'combo', 'combo2');

update product_ingredients
set quantity = case product_id
  when 'burger' then 0.13
  when 'combo' then 0.13
  when 'combo2' then 0.26
  else quantity
end
where inventory_item_id = 'carne-70-30'
  and product_id in ('burger', 'combo', 'combo2');
