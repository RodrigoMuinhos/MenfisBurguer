# Achados de segurança — Menfi's Burger

## Resumo executivo

O sistema possui bons controles pontuais — preços recalculados no Spring, BCrypt, queries parametrizadas, validação de transição de pedidos, HMAC do Mercado Pago, ACK manual e DLQ no RabbitMQ — mas eles são anulados em alguns caminhos por uma arquitetura **allow-by-default** e por rotas Next que acessam o banco diretamente.

Classificação usada: **P0 crítico**, **P1 alto**, **P2 médio**, **P3 baixo**. O levantamento é estático; não houve exploração, teste em produção ou acesso aos provedores.

## Achados confirmados

| ID | Prioridade | Achado | Evidência/impacto | Correção principal |
|---|---|---|---|---|
| SEC-001 | P0 | Rotas legadas Next contornam o backend | `/api/orders*` acessa PostgreSQL sem autenticação observada, aceita valores do cliente e permite alteração/exclusão/status | retirar da produção e concentrar escrita no Spring |
| SEC-002 | P0 | Credencial administrativa padrão no código | `AuthService` contém credencial de bootstrap conhecida | remover, invalidar conta/senha e rotacionar em todos os ambientes |
| SEC-003 | P0 | Spring permite tudo por padrão | `SecurityConfig` termina em `anyRequest().permitAll()`; autorização depende de chamadas manuais | negar por padrão e aplicar filtros/anotações/testes |
| SEC-004 | P1 | IDOR em pedidos e suporte | pedido completo, SSE individual, comprovante e ticket por `orderId` não validam dono/papel | autorização por recurso e IDs não enumeráveis |
| SEC-005 | P1 | Dashboard público | resumo e lista operacional não exigem autenticação | restringir a gerente/admin |
| SEC-006 | P1 | Webhook WhatsApp não autenticado | POST não valida assinatura da Meta; desafio aceita tokens alternativos embutidos | validar HMAC, remover fallback e aplicar idempotência |
| SEC-007 | P1 | Webhook Mercado Pago falha aberto | secret vazio pula validação; há endpoint GET processador | exigir secret em produção, aceitar POST assinado e confirmar dados |
| SEC-008 | P1 | Sessões não revogáveis e tokens longos | JWT em `localStorage`; admin 12 h e cliente 180 dias; logout só local | access curto, refresh rotativo em cookie, revogação e MFA |
| SEC-009 | P1 | RBAC insuficiente | apenas customer/delivery/admin; KDS opera como admin | criar KITCHEN, ATTENDANT, MANAGER e SYSTEM |
| SEC-010 | P1 | Defaults inseguros e ausência de fail-fast | JWT, RabbitMQ, WhatsApp e ambiente têm fallback de desenvolvimento | validador de inicialização por ambiente |
| SEC-011 | P2 | CORS e navegador pouco endurecidos | previews e redes privadas amplos; sem CSP/cabeçalhos explícitos | allowlist por ambiente e headers defensivos |
| SEC-012 | P2 | Banco acessado pelo frontend servidor | Next aceita conexão com certificado não validado e executa DDL em runtime | remover driver/credencial do frontend e exigir TLS verificado |
| SEC-013 | P2 | RabbitMQ parcialmente endurecido | DLQ/ACK existem; TLS, vhost, ACL, retry e limite não são impostos | identidade mínima, TLS e política operacional |
| SEC-014 | P2 | Risco de vazamento/retenção em logs e payloads | respostas de erro devolvem mensagens; payload bruto MP é persistido; stack traces podem conter contexto | redigir, limitar retenção e padronizar erros |
| SEC-015 | P2 | Ausência de controles de supply chain no repositório | sem CI de testes, SAST, SCA, secret scan, SBOM ou image scan | pipeline obrigatório e proteção de branch |
| SEC-016 | P2 | Entradas excessivas podem ser aceitas | não há configuração global para rejeitar propriedades JSON desconhecidas | DTOs estritos, limites e testes negativos |
| SEC-017 | P2 | Identificadores previsíveis expostos | IDs/números de pedido são usados em recursos públicos | token de consulta opaco ou autenticação + ownership |
| SEC-018 | P2 | Contas locais condicionadas por string de ambiente | sessões KDS/admin/delivery locais dependem de configuração correta | perfil Spring explícito e proibição em produção |

## Controles positivos que devem ser preservados

- BCrypt para senhas.
- Mensagem genérica de credencial inválida em parte do login.
- Recalculo de produto/adicional/total no `OrderService` do Spring.
- Validação de transições do pedido e regra de item exclusivo de kiosk.
- Uso frequente de parâmetros nas queries JDBC.
- HMAC e comparação em tempo constante no webhook Mercado Pago quando configurado.
- Consulta à API Mercado Pago e tabela idempotente de eventos.
- Filas duráveis, ACK manual, prefetch e DLQ no RabbitMQ.
- Actuator configurado para health/info sem detalhes.
- Frontend Docker executado como usuário não root.
- `.env` ignorado pelo Git.

## Itens ainda não comprovados

Devem ser auditados nos painéis externos antes de declarar o ambiente seguro:

- histórico completo de segredos no GitHub e forks;
- variáveis e logs na Vercel/Railway;
- MFA, membros, contas de serviço e sessões dos provedores;
- WAF, rate limiting e proteção contra bots;
- Neon: TLS, usuários mínimos, IP/network controls, backup/PITR e logs;
- RabbitMQ gerenciado: TLS, vhosts, ACLs e painel não público;
- Mercado Pago/Meta: URLs registradas, chaves ativas, rotação e alertas;
- segregação real entre desenvolvimento, homologação e produção;
- proteção de branch, revisões obrigatórias e GitHub Advanced Security.

## Limites deste documento

Não foram realizados pentest, DAST, teste de carga, auditoria das versões contra bases de CVE, leitura de valores secretos, rotação, acesso a produção ou alteração de código. “Não encontrado” significa apenas que o controle não apareceu no repositório analisado.

