update products
set name = case id
    when 'burger' then 'Menfi''s Burger Classic'
    when 'double-burger' then 'BIG Menfi''s Classic'
    when 'combo' then 'Combo Menfi''s Classic'
    when 'double-combo' then 'Combo BIG Menfi''s Classic'
    else name
  end,
  updated_at = now()
where id in ('burger', 'double-burger', 'combo', 'double-combo');

update pricing_products
set name = case id
    when 'burger' then 'Menfi''s Burger Classic'
    when 'double-burger' then 'BIG Menfi''s Classic'
    when 'combo' then 'Combo Menfi''s Classic'
    when 'double-combo' then 'Combo BIG Menfi''s Classic'
    else name
  end,
  updated_at = now()
where id in ('burger', 'double-burger', 'combo', 'double-combo');
