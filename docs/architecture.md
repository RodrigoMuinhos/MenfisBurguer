# Menfis Burger Delivery Architecture

## Flow

Cliente -> Vercel / Next.js -> Railway / Spring Boot -> Neon / PostgreSQL -> Mercado Pago Webhook -> KDS + Dashboard + Estoque

## Responsibilities

- Frontend exibe: telas, formulário, status por polling e painel admin.
- Backend decide: preço final, taxa, adicionais, combo, status, pagamento, estoque e auditoria.
- Banco registra: pedidos, pagamentos, histórico de status, movimentações e métricas.
- KDS executa: FIFO por `confirmed_at`, avanço controlado de status.
- Dashboard mede: vendas, ticket médio, delivery, retirada, últimos pedidos.
- Estoque controla: ficha técnica, baixa automática, mínimo e validade.

## Backend Authority

O frontend pode mostrar subtotal para UX, mas o total definitivo vem de `POST /orders`.

Regras implementadas no Spring Boot:

- `POST /orders` valida produto ativo e recalcula preço.
- `idempotencyKey` impede duplicidade.
- pedido online nasce `PENDING_PAYMENT`.
- pedido presencial autorizado nasce `RECEIVED`.
- webhook Mercado Pago é idempotente via `webhook_events`.
- KDS lista `RECEIVED`, `PREPARING`, `READY` por `confirmed_at ASC`.
- avanço inválido de status é bloqueado.
- toda mudança de status cria `order_status_history`.
- entrada em produção baixa estoque e cria `stock_movements`.
- eventos relevantes criam `audit_logs`.

## Local Services

- Frontend atual: `http://127.0.0.1:3000`
- Backend Spring Boot: `http://localhost:8080`
- Banco: Neon via `DATABASE_URL`

## Migration Plan

1. Manter rotas Next atuais como compatibilidade local.
2. Apontar frontend para `NEXT_PUBLIC_API_URL=http://localhost:8080`.
3. Migrar checkout para chamar `POST /orders` e depois `POST /payments/pix`.
4. Migrar tracking para `GET /orders/{id}/status` com polling de 5s.
5. Migrar KDS para `GET /kds/orders` e `PATCH /kds/orders/{id}/advance`.
6. Migrar dashboard e estoque para endpoints Spring.
7. Deploy backend Railway com `DATABASE_URL`, `JWT_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `CLOUDINARY_URL`, `FRONTEND_URL`, `BACKEND_URL`.
