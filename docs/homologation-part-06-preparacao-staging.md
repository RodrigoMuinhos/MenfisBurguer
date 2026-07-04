# Homologacao Menfi's Burger - Parte 6: Preparacao Do Staging

## Objetivo

Preparar um ambiente de homologacao isolado para testar o sistema completo sem encostar em producao.

Esta etapa descreve o que deve existir no staging, quais variaveis devem ser separadas e quais validacoes precisam passar antes de iniciar os testes P0.

## Regra Principal

Staging nao pode compartilhar recursos mutaveis com producao.

Isso significa:

- banco separado;
- filas separadas ou prefixadas;
- tokens de sandbox quando o provedor permitir;
- URL de frontend separada;
- URL de backend separada;
- webhook separado;
- logs separados;
- variaveis de ambiente separadas.

## Recursos Necessarios

### Frontend Staging

Criar um projeto ou ambiente separado para o frontend.

Nome sugerido:

```text
menfisburguer-frontend-staging
```

Responsabilidade:

- servir a experiencia do cliente;
- apontar para backend staging;
- usar chaves publicas de sandbox;
- nao apontar para API de producao.

### Backend Staging

Criar um servico separado para o backend.

Nome sugerido:

```text
menfisburguer-backend-staging
```

Responsabilidade:

- receber pedidos;
- executar regras de negocio;
- gravar no banco staging;
- expor Swagger e health checks;
- receber webhooks de sandbox.

### Banco Staging

Criar banco separado.

Nome sugerido:

```text
menfis_staging
```

Regras:

- nao usar a mesma `DATABASE_URL` de producao;
- nao copiar tokens reais de producao para staging;
- migrations Flyway devem rodar primeiro em staging;
- dados podem ser anonimizados ou criados manualmente para teste.

### Mensageria Staging

Usar instancia separada ou nomes de filas com prefixo.

Prefixo sugerido:

```text
staging.
```

Exemplos:

```text
staging.order.created
staging.payment.approved
staging.kitchen.ticket.updated
```

### Mercado Pago Staging

Usar credenciais de sandbox.

Regras:

- `MERCADO_PAGO_ACCESS_TOKEN` deve ser token sandbox;
- webhook deve apontar para backend staging;
- testes de pagamento devem usar usuarios/cartoes de teste;
- nenhum pagamento real deve ser iniciado nesta etapa.

### WhatsApp Staging

Se houver ambiente de teste no provedor, usar token e numero de teste.

Se nao houver ambiente de teste:

- manter WhatsApp real desativado no staging;
- validar apenas montagem da mensagem e link;
- nao disparar mensagem real como criterio automatico.

## Variaveis Do Frontend

Modelo esperado:

```env
NEXT_PUBLIC_API_URL=https://<backend-staging>
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_MP_PUBLIC_KEY=<sandbox_public_key>
NEXT_PUBLIC_ORDER_RUNTIME_MODE=delivery
```

Obrigatorio validar:

- `NEXT_PUBLIC_API_URL` nao aponta para producao;
- chave publica do Mercado Pago e de sandbox;
- dominio do frontend staging esta liberado no CORS do backend staging.

## Variaveis Do Backend

Modelo esperado:

```env
MENFIS_ENVIRONMENT=staging
DATABASE_URL=<database_url_staging>
JWT_SECRET=<jwt_secret_staging>
FRONTEND_URL=https://<frontend-staging>
BACKEND_URL=https://<backend-staging>
MERCADO_PAGO_ACCESS_TOKEN=<sandbox_access_token>
MERCADO_PAGO_WEBHOOK_SECRET=<webhook_secret_staging>
WHATSAPP_ACCESS_TOKEN=<test_token_or_empty>
WHATSAPP_PHONE_NUMBER_ID=<test_phone_id_or_empty>
RABBITMQ_HOST=<rabbitmq_staging_host>
RABBITMQ_USERNAME=<rabbitmq_staging_user>
RABBITMQ_PASSWORD=<rabbitmq_staging_password>
```

Obrigatorio validar:

- `DATABASE_URL` nao e a de producao;
- `JWT_SECRET` nao e o de producao;
- `FRONTEND_URL` aponta para staging;
- `BACKEND_URL` aponta para staging;
- Mercado Pago usa sandbox;
- mensageria usa staging.

## Checklist Antes Do Deploy Staging

- [ ] Banco staging criado.
- [ ] Backend staging criado.
- [ ] Frontend staging criado.
- [ ] Variaveis do backend staging preenchidas.
- [ ] Variaveis do frontend staging preenchidas.
- [ ] CORS do backend permite frontend staging.
- [ ] Webhook sandbox aponta para backend staging.
- [ ] Health check do backend configurado.
- [ ] Swagger disponivel apenas conforme politica definida.
- [ ] Migrations sem duplicidade.
- [ ] Build local backend aprovado.
- [ ] Build local frontend aprovado.

## Checklist Depois Do Deploy Staging

- [ ] `GET /actuator/health` retorna saudavel.
- [ ] `GET /v3/api-docs` responde no backend staging.
- [ ] Frontend staging abre no navegador.
- [ ] Frontend chama backend staging.
- [ ] `OPTIONS` de CORS passa para origem staging.
- [ ] Pedido simples e criado no banco staging.
- [ ] Pedido com adicional de carne e criado no banco staging.
- [ ] Pedido com adicional de frango e criado no banco staging.
- [ ] Checkout WhatsApp monta link corretamente no desktop.
- [ ] Checkout WhatsApp volta o fluxo corretamente no mobile.
- [ ] Mercado Pago sandbox cria preferencia/pagamento.
- [ ] Webhook sandbox atualiza pedido.
- [ ] KDS recebe pedido.
- [ ] Admin visualiza pedido.

## Criterio Para Avancar

Pode seguir para a Parte 7 quando:

- staging estiver criado;
- frontend e backend staging estiverem comunicando;
- banco staging estiver separado;
- nenhum endpoint de teste estiver usando producao;
- health check estiver OK;
- CORS estiver OK;
- migrations tiverem rodado no staging sem erro.

## Proxima Parte

Parte 7 - Execucao dos testes P0.

Objetivo:

- validar os fluxos criticos do sistema;
- registrar evidencia;
- separar aprovado, reprovado e bloqueado;
- impedir homologacao se algum P0 falhar.
