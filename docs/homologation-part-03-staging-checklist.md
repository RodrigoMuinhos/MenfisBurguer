# Homologacao Menfi's Burger - Parte 3: Staging e Protecao de Producao

## Objetivo

Definir como criar e usar um ambiente de homologacao sem impactar producao.

Esta parte continua documental. Nao altera Railway, Vercel, Neon, Mercado Pago, WhatsApp ou qualquer variavel remota. O objetivo e deixar claro o que deve existir antes de executar testes reais de homologacao.

## Regra De Ouro

Nenhuma alteracao nova deve ir direto para producao.

Antes de qualquer deploy em producao, a mesma versao deve passar por:

1. build local;
2. validacao de migrations;
3. deploy em staging;
4. teste funcional em staging;
5. checklist de rollback;
6. aprovacao manual.

## Ambientes Necessarios

### Local

Ambiente da maquina.

Uso:

- desenvolvimento;
- build;
- testes unitarios;
- teste rapido de UI;
- validacao inicial de migrations.

### Staging

Ambiente de homologacao.

Uso:

- simular producao com dados ficticios;
- validar deploy;
- validar migrations Flyway;
- testar pedido completo;
- testar webhook;
- testar KDS;
- testar kiosk;
- testar admin.

### Production

Ambiente real.

Uso:

- clientes reais;
- pagamentos reais;
- pedidos reais;
- operacao real.

Nao usar para teste de desenvolvimento.

## Estrutura Recomendada Para Staging

### Frontend Staging

Criar um projeto separado na Vercel ou um ambiente separado no mesmo projeto.

Variaveis esperadas:

```env
NEXT_PUBLIC_API_URL=https://<backend-staging>
NEXT_PUBLIC_MP_PUBLIC_KEY=<public_key_sandbox_ou_teste>
APP_BASE_URL=https://<frontend-staging>
NEXT_PUBLIC_ORDER_RUNTIME_MODE=delivery
```

Regras:

- nao apontar `NEXT_PUBLIC_API_URL` para backend de producao;
- nao usar dominio oficial do cliente;
- nao misturar cookies/sessao com producao;
- usar texto visual ou URL que deixe claro que e staging.

### Backend Staging

Criar servico separado no Railway.

Variaveis esperadas:

```env
MENFIS_ENVIRONMENT=staging
DATABASE_URL=<banco_staging>
JWT_SECRET=<segredo_staging>
FRONTEND_URL=https://<frontend-staging>
BACKEND_URL=https://<backend-staging>
MERCADO_PAGO_ACCESS_TOKEN=<token_sandbox_ou_teste>
MERCADO_PAGO_WEBHOOK_SECRET=<secret_staging>
WHATSAPP_VERIFY_TOKEN=<token_staging>
WHATSAPP_ACCESS_TOKEN=<token_staging_ou_vazio>
WHATSAPP_PHONE_NUMBER_ID=<id_staging_ou_controlado>
WHATSAPP_BUSINESS_ACCOUNT_ID=<id_staging_ou_controlado>
RABBITMQ_HOST=<host_staging>
RABBITMQ_PORT=<port_staging>
RABBITMQ_USERNAME=<user_staging>
RABBITMQ_PASSWORD=<password_staging>
```

Regras:

- nao usar `DATABASE_URL` de producao;
- nao usar `JWT_SECRET` de producao;
- nao usar `BACKEND_URL` de producao;
- nao usar `FRONTEND_URL` de producao;
- se WhatsApp real nao estiver isolado, deixar token vazio e testar apenas link `wa.me`;
- se Mercado Pago real nao estiver isolado, usar sandbox ou desabilitar teste real.

### Banco Staging

Criar banco separado no Neon ou Postgres isolado.

Regras:

- banco nao pode conter pedidos reais;
- dados podem ser copiados apenas anonimizados;
- migrations devem rodar primeiro aqui;
- se migration falhar, nao segue para producao;
- limpar dados de teste quando necessario.

### RabbitMQ Staging

Idealmente usar instancia separada.

Se nao houver, usar nomes de exchange/queue diferentes:

```env
MENFIS_ORDERS_EXCHANGE=menfis.staging.orders.exchange
MENFIS_KITCHEN_QUEUE=menfis.staging.kitchen.queue
MENFIS_KITCHEN_DLQ=menfis.staging.kitchen.dlq
MENFIS_KITCHEN_DLX=menfis.staging.kitchen.dlx
MENFIS_ORDER_PAID_ROUTING_KEY=staging.order.paid
```

## Checklist Antes De Deploy Em Staging

- [ ] `git status` revisado.
- [ ] Mudancas pertencem ao mesmo escopo.
- [ ] Nao ha `.env` versionado.
- [ ] Nao ha secret em codigo, README ou docs.
- [ ] Migrations Flyway nao possuem versao duplicada.
- [ ] Backend compila.
- [ ] Frontend compila.
- [ ] Variaveis de staging conferidas.
- [ ] Banco de staging selecionado.
- [ ] URL do frontend staging aponta para backend staging.
- [ ] URL do webhook aponta para backend staging.

Comandos locais sugeridos:

```powershell
git status -sb
mvn -q -DskipTests package
cd frontend
npm run build
```

## Checklist Depois Do Deploy Em Staging

- [ ] Backend iniciou sem crash.
- [ ] `GET /actuator/health` retorna `200`.
- [ ] `GET /settings/public` retorna `200`.
- [ ] Frontend abre sem erro critico no console.
- [ ] CORS permite frontend staging.
- [ ] Criar pedido simples.
- [ ] Criar pedido com adicional.
- [ ] Criar pedido com cupom.
- [ ] Criar pedido kiosk.
- [ ] Pedido aparece no admin.
- [ ] Pedido aparece no KDS.
- [ ] Status avanca corretamente.
- [ ] Tracking atualiza.
- [ ] Mercado Pago sandbox/teste retorna.
- [ ] Webhook duplicado nao duplica pedido.

## Checklist Antes De Producao

So executar quando staging passou.

- [ ] Versao homologada identificada por commit.
- [ ] Migrations ja testadas em staging.
- [ ] Rollback definido.
- [ ] Janela de menor movimento escolhida.
- [ ] Dono da validacao definido.
- [ ] Health check conhecido.
- [ ] Fluxo critico a testar em producao definido.
- [ ] Plano de comunicacao em caso de falha definido.

## Rollback

Rollback deve ser simples e claro.

### Se o frontend quebrar

1. Reverter para ultimo deploy estavel na Vercel.
2. Validar site.
3. Validar checkout.

### Se o backend quebrar antes de migration

1. Reverter para ultimo deploy estavel no Railway.
2. Validar `/actuator/health`.
3. Validar `/settings/public`.

### Se o backend quebrar depois de migration

1. Nao aplicar rollback automatico sem avaliar banco.
2. Identificar se migration alterou estrutura ou dados.
3. Se for migration apenas aditiva, reverter app pode ser seguro.
4. Se migration removeu/alterou dados, parar e avaliar backup.

## Regras Para Migrations

- Toda migration nova deve ter versao unica.
- Nunca reutilizar versao.
- Nunca editar migration ja aplicada em producao.
- Preferir migration aditiva.
- Evitar `drop`, `truncate` ou update massivo sem plano de rollback.
- Testar em staging antes.

Checagem local sugerida:

```powershell
Get-ChildItem backend/src/main/resources/db/migration |
  Group-Object { if ($_.Name -match '^V([^_]+)__') { $Matches[1] } else { $_.Name } } |
  Where-Object Count -gt 1
```

## Criterio De Conclusao Da Parte 3

Esta parte esta concluida quando:

- existe checklist de staging;
- existe checklist de producao;
- existe regra de rollback;
- existe regra de migration;
- o proximo trabalho pode ser validado sem tocar diretamente em producao.

## Proxima Parte

Parte 4 - Matriz de testes de homologacao.

Objetivo da Parte 4:

- listar cenarios de teste obrigatorios;
- definir passo a passo de cada fluxo;
- definir resultado esperado;
- separar testes delivery, kiosk, admin, KDS, pagamento, WhatsApp e LGPD.
