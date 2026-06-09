update orders
set channel = case
  when upper(coalesce(channel, '')) = 'KIOSK' then 'KIOSK'
  when upper(coalesce(payment_method, '')) = 'PRESENCIAL' then 'KIOSK'
  else 'DELIVERY'
end;

alter table orders alter column channel set default 'DELIVERY';

update orders
set status = case upper(status)
  when 'DRAFT' then 'CREATED'
  when 'PENDING_PAYMENT' then 'PAYMENT_PENDING'
  when 'AGUARDANDO_PAGAMENTO' then 'PAYMENT_PENDING'
  when 'RECEIVED' then 'PAID'
  when 'RECEBIDO' then 'PAID'
  when 'PREPARING' then 'IN_PREPARATION'
  when 'PREPARO' then 'IN_PREPARATION'
  when 'PRONTO' then 'READY'
  when 'SAIU_ENTREGA' then 'OUT_FOR_DELIVERY'
  when 'ENTREGUE' then 'DELIVERED'
  when 'CANCELED' then 'CANCELLED'
  when 'CANCELADO' then 'CANCELLED'
  when 'PAYMENT_FAILED' then 'CANCELLED'
  when 'PAGAMENTO_RECUSADO' then 'CANCELLED'
  else upper(status)
end;

update order_status_history
set from_status = case upper(from_status)
  when 'DRAFT' then 'CREATED'
  when 'PENDING_PAYMENT' then 'PAYMENT_PENDING'
  when 'RECEIVED' then 'PAID'
  when 'PREPARING' then 'IN_PREPARATION'
  when 'CANCELED' then 'CANCELLED'
  when 'PAYMENT_FAILED' then 'CANCELLED'
  else upper(from_status)
end
where from_status is not null;

update order_status_history
set to_status = case upper(to_status)
  when 'DRAFT' then 'CREATED'
  when 'PENDING_PAYMENT' then 'PAYMENT_PENDING'
  when 'RECEIVED' then 'PAID'
  when 'PREPARING' then 'IN_PREPARATION'
  when 'CANCELED' then 'CANCELLED'
  when 'PAYMENT_FAILED' then 'CANCELLED'
  else upper(to_status)
end;
