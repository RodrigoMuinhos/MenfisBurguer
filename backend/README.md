# Menfis Delivery Backend

Backend Spring Boot que assume as decisões de negócio do delivery:

- recalcula preço, taxa, adicionais e combo;
- salva pedido no PostgreSQL/Neon;
- cria pagamento Mercado Pago;
- recebe webhook idempotente;
- alimenta KDS por FIFO usando `confirmed_at`;
- movimenta estoque quando o pedido entra em produção;
- entrega dados reais para dashboard.

## Local

```powershell
$env:DATABASE_URL='jdbc:postgresql://HOST/DB?user=USER&password=PASSWORD&sslmode=require'
$env:JWT_SECRET='troque-por-um-segredo-com-32-caracteres'
$env:MERCADO_PAGO_ACCESS_TOKEN='APP_USR-...'
$env:FRONTEND_URL='http://localhost:3000'
$env:BACKEND_URL='http://localhost:8080'
mvn spring-boot:run
```

## Endpoints

- `POST /orders`
- `GET /orders/{id}`
- `GET /orders/{id}/status`
- `PATCH /orders/{id}/status`
- `POST /payments/pix`
- `POST /payments/webhook/mercadopago`
- `GET /kds/orders`
- `PATCH /kds/orders/{id}/advance`
- `GET /dashboard/summary`
- `GET /dashboard/orders`
- `GET /inventory`
- `POST /inventory/items`
- `PATCH /inventory/items/{id}`
- `POST /inventory/items/{id}/movement`
- `POST /auth/login`
