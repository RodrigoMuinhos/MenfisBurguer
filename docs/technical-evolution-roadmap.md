# Menfis Burger Technical Evolution Roadmap

## Objetivo

Evoluir o Menfi's Burger como monolito modular com frontend separado, backend autoritativo, banco relacional, mensageria, pagamentos e trilha de auditoria. A prioridade atual e estabilidade operacional antes de microsservicos.

## Estado Atual

- Frontend Next.js/React para delivery, kiosk, admin, KDS e acompanhamento.
- Backend Spring Boot com controllers, services, DTOs, Flyway, BCrypt e JWT.
- PostgreSQL/Neon como banco principal.
- RabbitMQ com fila de cozinha, ACK manual e DLQ para evento de pagamento aprovado.
- Mercado Pago com webhook idempotente em `webhook_events`.
- Auditoria em `audit_logs` e historico em `order_status_history`.
- CORS restrito aos dominios Menfi's, Vercel e ambientes locais.
- Health check via Actuator em `/actuator/health`.
- Swagger/OpenAPI em `/swagger-ui.html` e `/v3/api-docs`.

## Fase 1 - Estabilizacao

- Corrigir fluxos criticos de checkout, kiosk e PDV antes de grandes refactors.
- Manter backend como fonte de verdade para preco, adicional, cupom, taxa e total.
- Garantir idempotencia em criacao de pedido e webhooks.
- Padronizar erros de API com mensagens de negocio claras.
- Usar `/actuator/health` como health check do Railway.
- Documentar endpoints operacionais no Swagger.

## Fase 2 - Auth, Permissoes e Sessao

- Consolidar roles: `ADMIN`, `KITCHEN`, `ATTENDANT`, `CUSTOMER`, `KIOSK`.
- Aplicar autorizacao real no backend por rota, nao apenas no frontend.
- Implementar politica de "lembrar de mim" com expiracao controlada.
- Criar refresh token ou estrategia equivalente para sessoes longas.
- Bloquear rotas admin quando token/role nao for valido.

## Fase 3 - LGPD e Dados

- Registrar consentimentos em `customer_consents`.
- Anonimizar clientes quando solicitarem exclusao de dados.
- Evitar CPF quando nao houver finalidade clara.
- Nunca logar senha, token, CPF completo, codigo de recuperacao ou secrets.
- Manter pedidos sem dados pessoais identificaveis quando houver obrigacao operacional.

## Fase 4 - Mensageria Robusta

- Separar filas por responsabilidade:
  - `orders.queue`
  - `notifications.queue`
  - `printing.queue`
  - `payments.queue`
  - `dead-letter.queue`
- Padronizar eventos:
  - `ORDER_CREATED`
  - `PAYMENT_APPROVED`
  - `ORDER_ACCEPTED`
  - `ORDER_READY`
  - `ORDER_DELIVERED`
  - `ORDER_CANCELLED`
  - `PRINT_ORDER_REQUESTED`
  - `WHATSAPP_NOTIFICATION_REQUESTED`
- Adicionar retry controlado antes de DLQ.
- Criar painel de reprocessamento manual para eventos em erro.

## Fase 5 - Seguranca e Abuse Prevention

- Rate limiting em login, recuperacao de senha, criacao de pedido e webhooks.
- Validar assinatura dos webhooks antes de processar.
- Sanitizar entradas textuais que aparecem no admin, KDS e comprovantes.
- Revisar CORS quando o dominio final estiver consolidado.
- Auditar todas as acoes administrativas sensiveis.

## Fase 6 - Testes e Observabilidade

- Testes unitarios para services de pedido, preco, cupom, pagamento e auth.
- Testes de integracao para orders, payments, customers, coupons e KDS.
- E2E para delivery, kiosk, pagamento aprovado, entrada na cozinha e finalizacao.
- Logs estruturados para pedidos, webhooks, RabbitMQ, WhatsApp e impressao.
- Integrar Sentry ou ferramenta equivalente para frontend e backend.

## Diretriz Arquitetural

Manter monolito modular agora. Separar em microsservicos apenas depois que login, pedidos, pagamento, kiosk, KDS, estoque, mensageria e observabilidade estiverem estaveis e testados.
