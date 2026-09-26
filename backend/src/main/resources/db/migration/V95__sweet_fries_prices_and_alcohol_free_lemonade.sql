insert into addons (id, name, price, active)
values ('lemonade-sem-alcool', 'Sem álcool', 0.00, true)
on conflict (id) do update set
  name = excluded.name, price = excluded.price, active = true;

update pricing_products
set sale_price = sale_price + 5.00, updated_at = now()
where lower(trim(category)) like 'sweet%'
   or id in ('batata', 'batata-media', 'batata-pequena');

update products p
set base_price = p.base_price + 5.00, updated_at = now()
where exists (
  select 1 from pricing_products pp
  where pp.id = p.id
    and (lower(trim(pp.category)) like 'sweet%'
      or pp.id in ('batata', 'batata-media', 'batata-pequena'))
);
