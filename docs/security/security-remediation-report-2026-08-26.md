# Relatório de correção de segurança — 26/08/2026

## Resumo executivo

O achado confirmado pela auditoria controlada é uma exposição potencial IDOR/BOLA de severidade alta: o identificador sequencial do pedido podia ser usado sem prova de posse para obter dados pessoais e comerciais. Segundo o responsável pela auditoria, o teste foi limitado à confirmação da superfície exposta e não encontrou evidência de vazamento ou coleta indevida. A versão revisada fecha a leitura e as operações relacionadas ao pedido com uma destas credenciais: sessão administrativa/operacional válida, sessão do cliente proprietário ou token opaco exclusivo do pedido.

O risco não deve ser considerado encerrado em produção até que esta versão e a migração `V81__secure_order_access.sql` sejam implantadas, os segredos obrigatórios sejam configurados e os testes pós-deploy abaixo sejam executados.

## Superfície potencial confirmada antes da correção

- `GET /orders/{id}`: nome, telefone, endereço, itens, valores, cupom, pagamento e códigos operacionais.
- Identificadores `#NNNN` previsíveis permitiam enumeração.
- Rotas correlatas de status, comprovante e criação/consulta de suporte precisavam da mesma autorização em nível de objeto.
- Uma conta administrativa comprometida permitiria alterar itens/status ou excluir pedidos elegíveis; por isso as mutações permanecem restritas a `ADMIN` e o segredo JWT não pode usar o valor de desenvolvimento em produção.
- Webhooks sem segredo configurado aceitavam notificações sem HMAC. A atualização financeira consulta o recurso diretamente no Mercado Pago, o que impede forjar um pagamento aprovado, mas ainda deixava superfície de abuso e consumo de API.

## Controles implementados

- Token aleatório de 256 bits por pedido; somente o hash SHA-256 é persistido.
- Autorização por posse em detalhe, status, comprovante, PIX/checkout, pagamentos de terminal e suporte.
- Comparação do token em tempo constante e resposta `404` para não revelar se o pedido existe.
- Cliente autenticado só acessa pedidos ligados ao seu `customer_id`; perfis operacionais continuam separados por função.
- `PATCH`/`DELETE` de pedidos e aprovação de pagamento exigem `ADMIN`; entrega exige `DELIVERY` ou `ADMIN`.
- Lista geral e SSE geral de pedidos exigem `ADMIN`.
- Webhook Mercado Pago valida HMAC quando configurado e agora falha a inicialização de produção se o segredo estiver ausente.
- Produção falha ao iniciar com JWT fraco, curto ou com o valor padrão conhecido.
- Consultas e atualizações examinadas usam parâmetros JDBC, sem concatenação de entrada nas rotas de pedido/suporte.
- Limites de tamanho foram adicionados aos principais campos de criação de pedido e suporte, reduzindo payload abusivo e conteúdo persistido.

## Estado por risco

| Risco | Estado no código | Observação |
|---|---|---|
| Leitura de pedido por número | Corrigido | Requer dono, operação ou token opaco |
| Alteração/exclusão de pedido | Protegido | Somente administrador |
| Aprovação manual/estorno falso pelo cliente | Protegido | Aprovação é admin; estado financeiro remoto vem do provedor |
| Comprovante em pedido alheio | Corrigido | Mesma autorização por objeto |
| Suporte em pedido alheio | Corrigido | Criação e consulta agora validam posse |
| SQL injection em pedidos | Não evidenciada | SQL parametrizado; manter análise automatizada no CI |
| XSS armazenado | Mitigado parcialmente | React escapa texto por padrão e entradas têm limites; manter CSP e testes de saída |
| Enumeração automatizada | Mitigada, não concluída | Resposta indistinguível e token forte; falta rate limit distribuído na borda |
| Segredo JWT padrão | Corrigido no startup | Deploy exige segredo forte |
| Webhook sem HMAC | Corrigido no startup | Deploy exige segredo Mercado Pago |

## Ações obrigatórias antes do go-live

1. Configurar `JWT_SECRET` aleatório (mínimo 32 caracteres), `MERCADO_PAGO_WEBHOOK_SECRET`, `BACKEND_URL` e `FRONTEND_URL` HTTPS no Railway.
2. Implantar backend e frontend juntos e confirmar a execução da migração V81.
3. Invalidar sessões administrativas antigas e trocar credenciais administrativas, do Mercado Pago, WhatsApp e banco se houver qualquer suspeita de exposição.
4. Configurar rate limiting no proxy/WAF para login, recuperação, criação/consulta de pedidos, suporte e webhooks. Preferir armazenamento distribuído para funcionar com múltiplas réplicas.
5. Revisar logs de acesso do período potencialmente afetado procurando sequência de `GET /orders/#NNNN`; preservar evidências e acionar o responsável por privacidade/LGPD para avaliar comunicação e registro do incidente.
6. Definir retenção e mascaramento de PII em logs, backups e observabilidade.

## Teste pós-deploy sem dados reais

- Criar dois pedidos de teste A e B em homologação.
- Confirmar que A com seu token retorna `200` e que A sem token, com token de B e com cliente B retorna `404`.
- Repetir para `/status`, `/payment-proof`, `/payments/pix`, `/support/tickets` e `/support/tickets/order/{id}`.
- Confirmar que usuário comum recebe `403` em listagem, mudança de status, alteração de itens e exclusão.
- Confirmar que webhook sem assinatura ou com assinatura inválida recebe `403` em produção.
- Confirmar que respostas públicas não incluem telefone, endereço, cupom, código de entrega ou token.

## Validação local

- Backend: `mvn test` — 23 testes aprovados em 26/08/2026.
- Frontend: `npm run build` — compilação, tipos e 19 páginas concluídos com sucesso em 26/08/2026.

## Risco residual

Não é possível afirmar quantos registros foram acessados somente pelo código. Essa conclusão depende dos logs do Railway/proxy. Também permanecem controles operacionais fora do repositório: WAF/rate limit, rotação de segredos, alerta de enumeração, política de retenção e resposta LGPD.
