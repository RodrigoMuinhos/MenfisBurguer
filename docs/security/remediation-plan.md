# Plano de blindagem — Menfi's Burger

## Regra de execução

Corrigir primeiro dentro do código e da arquitetura controlada pela equipe; depois endurecer provedores e infraestrutura. Cada mudança deve passar por homologação, testes negativos, revisão e plano de reversão. Não aplicar tudo em um único deploy.

## Fase 0 — contenção imediata (0–24 horas)

### Internamente

1. Bloquear as rotas Next `/api/orders*` e `/api/customer` no deploy de produção; migrar consumidores restantes para o Spring.
2. Remover a credencial administrativa padrão do `AuthService`. Bootstrap apenas por variável obrigatória de uso único ou comando administrativo auditado.
3. Trocar Spring Security para negação por padrão. Liberar explicitamente somente login, catálogo/configuração pública, criação controlada de pedido e webhooks.
4. Proteger dashboard, pedido individual, SSE, comprovante, suporte e criação de pagamento com papel e ownership.
5. Fazer Mercado Pago falhar fechado quando o webhook secret não existir; desativar processamento via GET.
6. Validar `X-Hub-Signature-256` do WhatsApp e remover tokens alternativos embutidos.
7. Criar validação de startup que rejeite produção com segredo default, vazio ou curto.

### Externamente

1. Rotacionar senha administrativa e qualquer JWT/MP/Meta/Neon/RabbitMQ secret que possa ter sido reutilizado.
2. Revisar variáveis e logs Vercel/Railway; remover duplicatas e valores antigos.
3. Ativar MFA para GitHub, Vercel, Railway, Neon, Mercado Pago e Meta.
4. Confirmar que portas PostgreSQL/RabbitMQ e painéis administrativos não estão públicos.

### Critério de saída

- chamadas anônimas a dashboard, pedido alheio, status, exclusão e pagamentos retornam 401/403;
- produção não inicia com variável crítica ausente/default;
- rotas legadas retornam 404/410;
- webhooks falsos ou sem assinatura retornam 403 e não alteram estado.

## Fase 1 — autenticação e sessões (1–2 semanas)

### Internamente

- Access token de 10–15 minutos.
- Refresh token aleatório, rotativo, armazenado com hash no banco e família de sessão.
- Cookie `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, escopo mínimo; proteção CSRF quando cookie autenticar ação.
- Revogação por sessão/dispositivo, logout real e revogação de toda a família após reutilização.
- Invalidar todas as sessões depois de troca/reset de senha ou mudança de papel.
- Rate limit por IP + identidade em login/recuperação, atraso progressivo e bloqueio temporário.
- Respostas equivalentes para usuário inexistente, senha errada e recuperação.
- MFA obrigatório para admin/manager; reautenticação para credenciais, permissões e ações destrutivas.
- Retirar tokens sensíveis de `localStorage`; usar BFF/cookie seguro.

### Externamente

- Configurar domínio e HTTPS canônico.
- Definir expiração/rotação no gerenciador de segredos.
- Ativar alertas de login anômalo e recuperação.

### Testes

Roubo/reuso de refresh, logout, troca de senha, expiração, CSRF, brute force distribuído, enumeração e sessão simultânea.

## Fase 2 — autorização e isolamento (1–2 semanas)

### Internamente

1. Implementar `CUSTOMER`, `KITCHEN`, `ATTENDANT`, `DELIVERY`, `MANAGER`, `ADMIN`, `SYSTEM`.
2. Aplicar `@PreAuthorize`/policies e autorização por recurso no service, não apenas no controller.
3. Cliente só acessa pedido próprio; entrega só pedido atribuído; cozinha não acessa financeiro; gerente não gere credenciais; `SYSTEM` não possui login humano.
4. Substituir tokens em query string no SSE por cookie seguro ou ticket efêmero de uso único.
5. Auditar ator, ação, alvo, resultado e correlation ID em mudanças sensíveis.

### Matriz mínima

| Ação | CUSTOMER | KITCHEN | ATTENDANT | DELIVERY | MANAGER | ADMIN | SYSTEM |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ver próprio pedido | ✓ |  |  |  |  |  |  |
| Atualizar preparo |  | ✓ |  |  | ✓ | ✓ |  |
| Operar balcão |  |  | ✓ |  | ✓ | ✓ |  |
| Confirmar entrega atribuída |  |  |  | ✓ | ✓ | ✓ |  |
| Relatórios/estoque |  |  |  |  | ✓ | ✓ |  |
| Credenciais/papéis |  |  |  |  |  | ✓ |  |
| Confirmar evento técnico |  |  |  |  |  |  | ✓ |

## Fase 3 — pagamentos, webhooks e mensageria

### Internamente

- Mercado Pago: assinatura obrigatória, timestamp com janela curta, idempotência, consulta server-to-server e comparação de pedido, valor, moeda, recebedor e estado antes de confirmar.
- WhatsApp: HMAC do corpo bruto, comparação constante, idempotência e allowlist de tipos de evento.
- Não persistir payload bruto indefinidamente; guardar campos necessários ou versão redigida.
- RabbitMQ: `eventId`, consumidor idempotente, retry com backoff/limite, DLQ monitorada, tamanho máximo e schema versionado.
- Nunca colocar tokens, CPF, telefone completo ou dados de cartão em mensagens.

### Externamente

- Registrar uma única URL HTTPS de webhook por ambiente.
- Rotacionar secrets e remover URLs antigas nos painéis MP/Meta.
- Criar usuário RabbitMQ por serviço, vhost por ambiente, TLS obrigatório e permissões somente nas exchanges/queues necessárias.

## Fase 4 — aplicação e navegador

### Internamente

- CORS por allowlist exata de ambiente; não liberar todo `*.vercel.app` nem redes privadas em produção.
- CSP com nonce/hash, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e frame protection.
- Rejeitar propriedades JSON desconhecidas e aplicar limite de corpo, strings, arrays e paginação.
- Padronizar erro público com código/correlation ID; detalhes ficam somente no log redigido.
- Rate limit para login, recuperação, pedido, cupom, pagamento, suporte, SSE e webhooks.
- Upload futuro: MIME real, tamanho, extensão, nome aleatório, antivírus e storage privado com URL curta.
- Remover `pg` e `DATABASE_URL` do frontend após encerrar rotas diretas.

### Externamente

- WAF/rate limit na borda e proteção anti-bot nos pontos abusáveis.
- Desabilitar source maps públicos ou restringir seu acesso.
- Confirmar HTTPS/HSTS e domínio canônico na Vercel/Railway.

## Fase 5 — dados, infraestrutura e continuidade

### Internamente

- Banco somente pelo backend, migrations apenas no deploy, usuário de runtime sem DDL.
- TLS com certificado validado, pools/timeout, constraints e transações.
- Mascarar PII e estabelecer retenção/exclusão para pedidos, suporte, WhatsApp, pagamentos e logs.
- Separar totalmente dev/staging/prod, inclusive banco, filas, chaves e webhooks.
- Imagens fixadas por digest, usuário não root no backend, filesystem read-only quando possível e healthcheck sem dados.

### Externamente

- Neon: usuário por ambiente/serviço, menor privilégio, backup/PITR testado e alertas.
- Railway/Vercel: membros mínimos, preview sem dados de produção, logs e variáveis restritos.
- RabbitMQ: painel privado, TLS, backup de definições e alertas de DLQ.
- Testar restauração e documentar RPO/RTO.

## Fase 6 — segurança contínua

### Pipeline obrigatório

1. PR e revisão obrigatórios; branch protegida.
2. Testes unitários, integração e autorização negativa.
3. Gitleaks/secret scanning em árvore e histórico.
4. SAST (CodeQL), SCA de Maven/npm, licença e atualização automatizada.
5. SBOM e scan de imagens.
6. DAST em homologação e pentest antes de grandes lançamentos.
7. Bloqueio de deploy para P0/P1 e processo documentado de exceção.

## Ordem prática de implementação

| Lote | Entrega | Dependência |
|---|---|---|
| A | desativar rotas diretas, rotacionar defaults, fail-fast | nenhuma |
| B | Spring deny-by-default + testes de todos endpoints | A |
| C | ownership e RBAC completo | B |
| D | sessão curta/refresh/revogação/MFA | B |
| E | webhooks e RabbitMQ endurecidos | A |
| F | CSP/CORS/rate limits/erros e logs | B |
| G | Neon/provedores/CI/backup/pentest | A–F |

## Definição de “blindado”

O sistema só deve ser declarado blindado quando:

- não existe caminho alternativo direto ao banco;
- todos os endpoints têm decisão explícita e testes 401/403/ownership;
- nenhum segredo/default está no código ou histórico ativo;
- sessões são curtas, rotativas e revogáveis;
- webhooks são autenticados, confirmados e idempotentes;
- RBAC separa cliente, cozinha, balcão, entrega, gerente, admin e sistema;
- logs não vazam segredos/PII e geram alertas úteis;
- ambientes e contas externas estão segregados com MFA;
- backup/restauração, scans contínuos e pentest foram concluídos.

