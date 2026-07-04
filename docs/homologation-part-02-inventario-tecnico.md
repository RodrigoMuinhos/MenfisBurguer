# Homologacao Menfi's Burger - Parte 2: Inventario Tecnico

## Objetivo

Mapear o que ja existe no sistema antes de iniciar correcoes de homologacao. Esta etapa evita mexer no codigo "no escuro" e ajuda a decidir a ordem correta das proximas partes.

Esta parte e apenas documental. Nao altera producao, nao faz deploy, nao muda variaveis remotas e nao executa migration.

## Resumo Da Arquitetura Atual

O sistema esta organizado como monorepo:

```text
menfisburguer/
  backend/   Spring Boot
  frontend/  Next.js / React
  docs/      documentacao tecnica e operacional
```

Fluxo principal atual:

```text
Cliente / Kiosk / Admin
  -> Frontend Next.js
  -> Backend Spring Boot
  -> PostgreSQL / Neon
  -> Mercado Pago / RabbitMQ / WhatsApp
```

## Frontend

### Stack

- Next.js
- React
- TypeScript
- Tailwind/classes utilitarias
- Deploy previsto: Vercel

### Entradas principais encontradas

```text
frontend/src/app/page.tsx
frontend/src/app/adm/page.tsx
frontend/src/app/kds/page.tsx
frontend/src/app/notas/page.tsx
frontend/src/app/entrega/page.tsx
frontend/src/app/politica-de-privacidade/page.tsx
frontend/src/app/termos-de-servico/page.tsx
frontend/src/app/exclusao-de-dados/page.tsx
```

### Modulos visuais relevantes

```text
frontend/src/components/product/
frontend/src/components/order/
frontend/src/components/admin/
frontend/src/features/catalog/
frontend/src/services/
frontend/src/types/
```

### Pontos fortes

- Ja existe fluxo de cardapio, carrinho, checkout e tracking.
- Ja existe tela mobile de menu.
- Ja existem telas admin, KDS, notas e entregador.
- Ja existem paginas de privacidade, termos e exclusao de dados.
- O frontend usa `NEXT_PUBLIC_API_URL` para falar com o backend publico.

### Riscos para homologacao

- Ainda ha logica operacional relevante no frontend.
- Existem rotas API internas do Next em `frontend/src/app/api`, que podem confundir com o backend Spring.
- Carrinho e sessao dependem bastante de `localStorage`.
- A protecao real de permissao nao pode depender apenas do frontend.
- Fluxos mobile e desktop precisam ser testados separadamente.

## Backend

### Stack

- Java 21
- Spring Boot
- Spring Web
- Spring Security
- Spring Validation
- Spring Data JPA
- JDBC Template em services
- Flyway
- RabbitMQ / AMQP
- PostgreSQL
- JWT
- BCrypt

### Controllers encontrados

```text
AuthController
CouponController
CustomerController
DashboardController
InventoryController
KdsController
KitchenController
OrderController
PaymentController
SettingsController
SupportController
WhatsAppWebhookController
```

### Services encontrados

```text
AuditService
AuthService
CouponService
CustomerService
DashboardService
InventoryService
KdsService
OrderEventService
OrderService
PaymentService
SettingsService
SupportService
WhatsAppService
```

### Pontos fortes

- `OrderService` centraliza criacao e transicao de pedidos.
- Backend recalcula preco de produtos e adicionais.
- Existe `order_status_history`.
- Existe `audit_logs`.
- Existe `webhook_events` para idempotencia.
- Existe BCrypt para senha.
- Existe RabbitMQ com ACK manual e DLQ para evento de pedido pago.
- Existe CORS configurado para dominios Menfi's, Vercel e local.

### Riscos para homologacao

- `SecurityConfig` atualmente permite todas as rotas; permissao real precisa ser revisada.
- Auth e roles precisam ser consolidados para `ADMIN`, `KITCHEN`, `ATTENDANT`, `CUSTOMER`, `KIOSK`.
- Controllers e services ainda podem crescer demais se novas regras forem adicionadas sem modularizacao.
- Erros de API precisam ser padronizados para cliente e admin.
- Rate limiting ainda nao foi identificado como implementado.

## Banco De Dados E Migrations

### Tecnologia

- PostgreSQL
- Flyway
- Neon em producao

### Migrations existentes

Foram encontradas migrations de `V1` ate `V26`, incluindo:

```text
V1__core_schema.sql
V2__seed_mvp.sql
V7__order_coupons.sql
V9__canonical_order_channel_and_status.sql
V11__app_settings.sql
V18__operation_reset_and_test_mode.sql
V19__customer_profiles_crm.sql
V20__customer_password_login.sql
V21__customer_crud_and_recovery.sql
V22__whatsapp_messages.sql
V23__menfis_club_subscriptions.sql
V25__rabbitmq_order_event_log.sql
V26__customizer_addons.sql
```

### Pontos fortes

- Schema versionado.
- Produtos, pedidos, pagamentos, estoque, cupons, clientes e historico ja aparecem nas migrations.
- A duplicidade de versao Flyway ja foi identificada como risco real e corrigida no fluxo anterior.

### Riscos para homologacao

- Toda nova migration precisa passar por checagem de versao unica.
- Migrations devem ser testadas em banco isolado antes de producao.
- Dados reais nao devem ser usados para teste destrutivo.
- Criar migrations corretivas sem rollback operacional aumenta risco.

## Pagamentos

### Provedor atual

- Mercado Pago

### Pontos existentes

- `PaymentController`
- `PaymentService`
- criacao de Pix/checkout
- webhook Mercado Pago
- validacao de assinatura quando secret configurado
- idempotencia por `webhook_events`

### Riscos para homologacao

- Validar sandbox/staging separado de producao.
- Confirmar que `BACKEND_URL` do webhook aponta para ambiente correto.
- Confirmar que pedido so entra na cozinha quando pagamento for aprovado, exceto fluxo presencial.
- Testar webhook duplicado, atrasado e com pagamento rejeitado.

## RabbitMQ

### Configuracao atual

- Exchange de pedidos.
- Fila de cozinha.
- DLQ de cozinha.
- ACK manual.
- `prefetch=1`.

### Pontos fortes

- Ja ha base para nao perder evento de pedido pago.
- Ja existe log de ACK/NACK.
- Ja existe tabela de eventos processados para evitar duplicidade.

### Riscos para homologacao

- Ainda nao ha separacao completa de filas para notificacao, impressao e pagamentos.
- Retry controlado antes de DLQ precisa ser evoluido.
- Painel de reprocessamento ainda nao existe.

## LGPD

### Ja existe

- Pagina de politica de privacidade.
- Pagina de termos.
- Pagina de exclusao de dados.
- Cadastro de cliente.
- Dados de contato e endereco.

### Faltas importantes

- Tabela `customer_consents`.
- Registro de consentimento por tipo.
- Fluxo real de anonimizacao.
- Politica clara de retencao de dados.
- Garantia de logs sem dados sensiveis.

## Deploy E Ambientes

### Producao atual esperada

- Frontend: Vercel.
- Backend: Railway.
- Banco: Neon.

### Riscos ja observados

- Backend pode cair por migration duplicada.
- Console do navegador pode mostrar CORS quando o problema real e backend 502.
- Deploy automatico em `main` afeta producao se nao houver staging.

### Necessidade para homologacao

- Criar ou confirmar ambiente staging.
- Separar variaveis de staging e producao.
- Health check antes de liberar teste funcional.
- Checklist de rollback.

## Prioridades Identificadas

### Prioridade 1

- Isolar staging.
- Criar checklist de deploy.
- Validar health check.
- Travar regra de migration unica.
- Testar fluxo de pedido completo em ambiente isolado.

### Prioridade 2

- Revisar auth e permissao real no backend.
- Padronizar erros de API.
- Validar webhook Mercado Pago em staging.
- Criar testes de pedido com adicionais.

### Prioridade 3

- Consentimentos LGPD.
- Rate limiting.
- Observabilidade com logs estruturados.
- RabbitMQ com filas adicionais.

## Criterio De Conclusao Da Parte 2

Esta parte esta concluida quando:

- o inventario tecnico esta registrado;
- os principais modulos foram identificados;
- os riscos atuais estao claros;
- existe base para montar a Parte 3 sem tocar em producao.

## Proxima Parte

Parte 3 - Checklist de ambiente staging e protecao de producao.

Objetivo da Parte 3:

- definir variaveis necessarias para staging;
- definir como validar deploy sem afetar producao;
- criar checklist antes de executar qualquer migration ou release;
- preparar um plano de rollback.
