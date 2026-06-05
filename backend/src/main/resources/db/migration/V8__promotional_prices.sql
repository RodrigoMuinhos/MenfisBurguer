update products
set base_price = case id
  when 'burger' then 21.90
  when 'double-burger' then 29.90
  when 'combo' then 34.90
  when 'double-combo' then 42.90
  when 'combo2' then 59.90
  else base_price
end
where id in ('burger', 'double-burger', 'combo', 'double-combo', 'combo2');
