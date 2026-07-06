alter table pricing_products add column if not exists image_url text;
alter table pricing_products add column if not exists original_price numeric(12,2);

update pricing_products
set image_url = case id
  when 'burger' then '/menu/menfisburguer.png'
  when 'double-burger' then '/menu/Double menfis.png'
  when 'menfis-chicken' then '/menu/CHICKEN.png'
  when 'double-menfis-chicken' then '/menu/DOUBLECHICKEN.png'
  when 'menfis-bacon' then '/menu/BACON.png'
  when 'double-menfis-bacon' then '/menu/DOUBLEBACON.png'
  when 'combo' then '/menu/combomenfis.png'
  when 'double-combo' then '/menu/combodoublemenfi.png'
  when 'combo2' then '/menu/supercombomnfis.png'
  when 'chicken-combo' then '/menu/COMBOCHICKEN.png'
  when 'double-chicken-combo' then '/menu/COMBODOUBLECHICKEN.png'
  when 'chicken-super-combo' then '/menu/SUPERCOMBOCHICKEN.png'
  when 'bacon-combo' then '/menu/BACONCOMBO.png'
  when 'double-bacon-combo' then '/menu/DOUBLEBACONCOMBO.png'
  when 'bacon-super-combo' then '/menu/SUPERCOMBOBACON.png'
  when 'batata' then '/EXTRAS/batata.jpg'
  when 'guarana-zero' then '/EXTRAS/Gurarana.jpg'
  when 'coca-zero' then '/EXTRAS/cocazero.jpg'
  else image_url
end
where image_url is null;

update pricing_products
set original_price = case id
  when 'burger' then 25.90
  when 'double-burger' then 39.90
  when 'menfis-chicken' then 29.90
  when 'double-menfis-chicken' then 45.90
  when 'menfis-bacon' then 34.90
  when 'double-menfis-bacon' then 47.90
  when 'combo' then 44.90
  when 'double-combo' then 58.90
  when 'combo2' then 79.90
  when 'chicken-combo' then 51.90
  when 'double-chicken-combo' then 66.90
  when 'chicken-super-combo' then 86.90
  when 'bacon-combo' then 54.90
  when 'double-bacon-combo' then 69.90
  when 'bacon-super-combo' then 108.90
  else original_price
end
where original_price is null;
