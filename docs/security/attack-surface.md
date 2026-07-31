# Superfície de ataque — Menfi's Burger

> Inventário estático de 24/07/2026. “Protegido manualmente” significa que o controller chama `AuthService`; a cadeia global do Spring ainda está permissiva.

## Entradas públicas e privadas

### Spring Boot

| Área | Entradas | Proteção observada | Risco principal |
|---|---|---|---|
| Autenticação | `/auth/*`, `/customers/login`, sessão e recuperação | Públicas por necessidade | força bruta, sessão longa |
| Perfil do cliente | `/customers/me`, `/customers/orders` | cliente manual | token roubado, ausência de revogação |
| CRM de clientes | `/customers/crm`, `/customers/admin/*` | admin manual | privilégio administrativo amplo |
| Pedidos | `/orders`, `/api/orders` | criação pública/opcional; lista admin | abuso de criação |
| Pedido individual | `GET /orders/{id}`, status e SSE individual | **sem autorização** | IDOR e exposição de pedido/PII |
| Comprovante | `POST /orders/{id}/payment-proof` | **sem autorização** | alteração de pedido alheio |
| Operações de pedido | aprovação, itens, status, exclusão | admin manual | controle frágil por controller |
| Dashboard | `/dashboard/summary`, `/dashboard/orders` | **sem autorização** | exposição operacional/financeira |
| KDS/cozinha | `/kds/orders*`, `/kitchen/orders` | admin manual | cozinha recebe acesso de admin |
| Entrega | `/orders/delivery-route`, confirmação | delivery ou admin manual | falta de autorização por atribuição |
| Estoque/monitoramento | `/inventory/*`, `/monitoring/*` | admin manual | ausência de papéis gerente/atendente |
| Configuração/preços/cupons | `/settings/*`, `/pricing/*`, `/coupons/*` | escrita admin; parte pública | privilégio amplo e dados excessivos |
| Suporte | criação pública; lista admin; consulta por pedido pública | parcial | IDOR em ticket por pedido |
| Pagamentos | `/payments/pix`, `/checkout` | **sem vínculo com dono** | iniciar/consultar pagamento alheio |
| Webhook Mercado Pago | GET e POST | assinatura condicional | aceita sem validação se secret vazio |
| Webhook WhatsApp | aliases em `/api/whatsapp`, `/webhooks` | desafio por token; POST sem assinatura | evento forjado |
| Actuator/OpenAPI | configuração/dependência presentes | health/info limitados no YAML | confirmar exposição em produção |

### Next.js

| Rota | Acesso | Impacto |
|---|---|---|
| `GET/POST /api/orders` | sem autenticação observada | lista pedidos e grava pedido confiando em valores do cliente |
| `PATCH/DELETE /api/orders/{id}` | sem autenticação observada | altera ou exclui pedido diretamente no banco |
| `PATCH /api/orders/{id}/status` | sem autenticação observada | muda estado e estado financeiro |
| `POST /api/customer` | sem autenticação observada | cria/atualiza cadastro por dados fornecidos |
| `/backend/{path}` | proxy para Spring | encaminha entrada externa; segurança depende integralmente do backend |

As rotas Next executam DDL em tempo de requisição e usam conexão PostgreSQL direta. Elas devem ser removidas do caminho de produção.

## Segredos e configuração

Variáveis relevantes localizadas:

- banco: `DATABASE_URL`, `JDBC_DATABASE_URL`;
- JWT e credenciais de bootstrap;
- RabbitMQ: host, porta, usuário e senha;
- Mercado Pago: access token, public key e webhook secret;
- WhatsApp: access token, verify token, phone number ID e business account ID;
- URLs públicas/internas e modo do ambiente.

Estado:

- arquivos `.env` locais estão ignorados;
- não foi encontrado `.env` versionado no histórico de nomes consultado;
- `.env.docker.example` não contém tokens reais conhecidos, mas traz defaults inseguros;
- `application.yml`, `docker-compose.yml` e `AuthService` aceitam ou contêm credenciais/defaults fracos;
- não há validação central que impeça produção de iniciar com defaults;
- não há Gitleaks instalado nem pipeline de secret scanning no repositório.

Nunca registrar os valores encontrados. Qualquer credencial que já tenha sido usada fora de um gerenciador de segredos deve ser tratada como potencialmente exposta e rotacionada.

## Integrações e dados

| Componente | Controle existente | Lacuna |
|---|---|---|
| PostgreSQL | queries parametrizadas via JDBC em grande parte; Flyway | rota Next com acesso direto, TLS sem validar certificado, DDL em runtime, usuário mínimo não comprovado |
| Mercado Pago | HMAC e comparação constante; busca do pagamento; idempotência de webhook | assinatura falha aberta, GET webhook, vínculo do solicitante e validação explícita de valor/moeda precisam endurecer |
| WhatsApp | token de desafio e logs sem imprimir token | tokens alternativos embutidos; falta `X-Hub-Signature-256` no POST |
| RabbitMQ | filas duráveis, ACK manual, DLQ, prefetch e não requeue | TLS, vhost, credencial mínima, retry/backoff, limite e idempotência precisam ser comprovados |
| QR Code | payload de PIX recebido do Mercado Pago | não foi encontrada geração própria de QR privilegiado |
| Upload | comprovante é conteúdo textual/URL no fluxo observado | impor tipo, tamanho, origem e armazenamento seguro se arquivo binário for habilitado |
| Logs | IDs operacionais e auditoria estruturada parcial | exceções completas, payload bruto de pagamento e PII/retensão precisam de política |

## Navegador e borda

- JWT de cliente, admin e entrega é persistido em `localStorage`.
- Logout atual remove o dado local, mas não revoga o token no servidor.
- A consulta da captura por uma chave genérica retornar `null` não comprova ausência de tokens; a aplicação usa outras chaves.
- `next.config.mjs` não define CSP, HSTS ou demais cabeçalhos defensivos.
- CORS aceita produção, qualquer preview `*.vercel.app`, localhost e faixas de rede privada.
- Não há rate limiting localizado no frontend, backend ou infraestrutura versionada.
- Source maps públicos e proteção WAF/Vercel precisam ser verificados externamente.

## Infraestrutura e cadeia de entrega

- Imagens não estão fixadas por digest e não há scan de imagem/SBOM.
- Compose publica PostgreSQL e painel/porta RabbitMQ no host para desenvolvimento.
- O contêiner frontend usa usuário não root; controle positivo.
- Não há workflow GitHub Actions, CodeQL, Dependabot ou Gitleaks versionado.
- Proteção de branch, MFA, contas de serviço, backups, PITR e segregação dev/staging/prod são **VERIFICAR EXTERNAMENTE**.

