update products
set base_price = 6.90,
    updated_at = now()
where id = 'guarana-zero';

update order_items
set unit_price = 6.90,
    total_price = quantity * 6.90
where (
    product_id = 'guarana-zero'
    or lower(name) like '%guarana zero%'
    or lower(name) like '%guaraná zero%'
  )
  and unit_price = 8.90;

with order_item_prices as (
  select
    o.id,
    item_data.item,
    item_data.ordinality,
    coalesce(nullif(item_data.item->>'quantity', '')::numeric, nullif(item_data.item->>'qty', '')::numeric, 1) as quantity,
    coalesce(nullif(item_data.item->>'unitPrice', '')::numeric, nullif(item_data.item->>'price', '')::numeric, 0) as unit_price,
    (
      item_data.item->>'productId' = 'guarana-zero'
      or item_data.item->>'id' = 'guarana-zero'
      or lower(item_data.item->>'name') like '%guarana zero%'
      or lower(item_data.item->>'name') like '%guaraná zero%'
    ) as is_guarana_zero
  from orders o
  cross join lateral jsonb_array_elements(o.items) with ordinality as item_data(item, ordinality)
),
fixed_orders as (
  select
    id,
    sum(
      case
        when is_guarana_zero and unit_price = 8.90 then (8.90 - 6.90) * quantity
        else 0
      end
    ) as correction,
    jsonb_agg(
      case
        when is_guarana_zero and unit_price = 8.90 then
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(item, '{name}', to_jsonb('Guaraná Zero'::text), true),
                '{price}', to_jsonb(6.90::numeric), true
              ),
              '{unitPrice}', to_jsonb(6.90::numeric), true
            ),
            '{totalPrice}', to_jsonb((6.90 * quantity)::numeric), true
          )
        else item
      end
      order by ordinality
    ) as items
  from order_item_prices
  group by id
  having sum(
    case
      when is_guarana_zero and unit_price = 8.90 then (8.90 - 6.90) * quantity
      else 0
    end
  ) > 0
)
update orders o
set items = fixed_orders.items,
    subtotal = case
      when o.subtotal is null then null
      else greatest(0, o.subtotal - fixed_orders.correction)
    end,
    total = greatest(0, o.total - fixed_orders.correction),
    updated_at = now()
from fixed_orders
where o.id = fixed_orders.id;
