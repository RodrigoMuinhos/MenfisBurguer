insert into pricing_products (
  id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
  alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active, test_mode
)
values
  ('combo2', 'SUPER-MENFIS', 'Super Combo Menfi''s', 'Combo', 'combo', 15.00, 3.70, 5.78, 7.78, 2.00, 59.90, 0.35, true, false),
  ('chicken-super-combo', 'SUPER-CHICKEN', 'Super Combo Menfi''s Chicken', 'Combo', 'combo', 12.60, 3.70, 5.78, 7.78, 2.00, 64.90, 0.35, true, false),
  ('bacon-super-combo', 'SUPER-BACON', 'Super Combo Menfi''s Bacon', 'Combo', 'combo', 19.60, 3.70, 5.78, 7.78, 2.00, 71.90, 0.35, true, false)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  kind = excluded.kind,
  base_cost = excluded.base_cost,
  fries_cost = excluded.fries_cost,
  default_drink_cost = excluded.default_drink_cost,
  alternative_drink_cost = excluded.alternative_drink_cost,
  drink_surcharge = excluded.drink_surcharge,
  sale_price = excluded.sale_price,
  target_cmv = excluded.target_cmv,
  active = excluded.active,
  updated_at = now();

insert into order_cost_snapshots (
  order_id, order_item_id, product_id, product_name, quantity, sale_price_snapshot,
  cost_snapshot, gross_profit_snapshot, cmv_snapshot, margin_snapshot, test_mode, created_at
)
select
  oi.order_id,
  oi.id,
  oi.product_id,
  oi.name,
  oi.quantity,
  oi.total_price,
  round(
    (
      case when pp.kind = 'combo'
        then pp.base_cost + pp.fries_cost + pp.default_drink_cost
        else pp.base_cost
      end
    ) * oi.quantity,
    2
  ) as cost_snapshot,
  round(
    oi.total_price - (
      case when pp.kind = 'combo'
        then pp.base_cost + pp.fries_cost + pp.default_drink_cost
        else pp.base_cost
      end
    ) * oi.quantity,
    2
  ) as gross_profit_snapshot,
  case when oi.total_price > 0 then round((
    (
      case when pp.kind = 'combo'
        then pp.base_cost + pp.fries_cost + pp.default_drink_cost
        else pp.base_cost
      end
    ) * oi.quantity
  ) / oi.total_price, 4) else 0 end as cmv_snapshot,
  case when oi.total_price > 0 then round((
    oi.total_price - (
      case when pp.kind = 'combo'
        then pp.base_cost + pp.fries_cost + pp.default_drink_cost
        else pp.base_cost
      end
    ) * oi.quantity
  ) / oi.total_price, 4) else 0 end as margin_snapshot,
  o.test_mode,
  o.created_at
from order_items oi
join orders o on o.id = oi.order_id
join pricing_products pp on pp.id = case oi.product_id
  when 'combo-menfis' then 'combo'
  when 'combo-menfis-bacon' then 'bacon-combo'
  when 'combo-menfis-chicken' then 'chicken-combo'
  when 'super-combo-menfis' then 'combo2'
  when 'super-combo-menfis-bacon' then 'bacon-super-combo'
  when 'super-combo-menfis-chicken' then 'chicken-super-combo'
  when 'combo-coca-adicional' then 'coca-zero'
  else oi.product_id
end and pp.test_mode = o.test_mode
where not exists (
  select 1 from order_cost_snapshots existing
  where existing.order_item_id = oi.id
);
