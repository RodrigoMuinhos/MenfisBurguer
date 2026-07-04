# Homologacao Menfi's Burger - Parte 7: Execucao Dos Testes P0

## Objetivo

Executar os testes obrigatorios para homologar o sistema em staging.

Um teste P0 representa fluxo critico. Se qualquer P0 falhar, a homologacao deve parar ate correcao e nova execucao.

## Regras De Execucao

- Executar somente em staging.
- Registrar evidencia de cada teste.
- Nao usar pagamento real.
- Nao usar banco de producao.
- Nao corrigir direto em producao.
- Quando houver bug, abrir item de correcao e repetir o teste depois.

## Modelo De Registro

Use este formato para cada teste:

```text
ID:
Data:
Responsavel:
Ambiente:
Build/commit:
Status: Pendente | Aprovado | Reprovado | Bloqueado
Evidencia:
Observacoes:
```

## Testes De Plataforma

### ST-01 - Health Do Backend

Passos:

1. Acessar `GET /actuator/health` no backend staging.
2. Confirmar resposta HTTP 200.
3. Confirmar status saudavel.

Esperado:

- backend responde;
- aplicacao nao esta crashando;
- health check pode ser usado por monitoramento.

### ST-02 - Frontend Staging Abre

Passos:

1. Abrir URL do frontend staging.
2. Navegar pela home.
3. Abrir produto.
4. Abrir carrinho.

Esperado:

- pagina carrega;
- imagens principais carregam;
- nao ha erro bloqueante no console.

### ST-03 - CORS Frontend Para Backend

Passos:

1. Abrir frontend staging.
2. Executar acao que chama backend.
3. Conferir Network do navegador.

Esperado:

- preflight `OPTIONS` aprovado;
- backend responde com headers CORS corretos;
- frontend nao recebe erro de CORS.

## Testes De Cardapio E Carrinho

### CT-01 - Pedido Com Produto Simples

Passos:

1. Escolher um produto sem adicionais.
2. Adicionar ao carrinho.
3. Conferir subtotal.
4. Ir para checkout.

Esperado:

- item aparece no carrinho;
- preco fecha corretamente;
- checkout permite continuar.

### CT-02 - Quantidade Do Produto

Passos:

1. Adicionar um produto.
2. Aumentar quantidade.
3. Reduzir quantidade.
4. Conferir total.

Esperado:

- quantidade altera sem travar;
- total acompanha a quantidade;
- item nao fica negativo.

### CT-03 - Pedido Com Adicional De Carne

Passos:

1. Abrir produto que aceita extras.
2. Adicionar `Adicional de carne`.
3. Adicionar produto ao carrinho.
4. Finalizar pedido via checkout.

Esperado:

- adicional aparece no item;
- preco do adicional entra no total;
- backend aceita payload;
- pedido e criado sem travar;
- WhatsApp/ERP/KDS mostram o adicional.

### CT-04 - Pedido Com Adicional De Frango

Passos:

1. Abrir produto que aceita extras.
2. Adicionar `Adicional de frango`.
3. Adicionar produto ao carrinho.
4. Finalizar pedido via checkout.

Esperado:

- adicional aparece no item;
- preco do adicional entra no total;
- backend aceita payload;
- pedido e criado sem travar;
- WhatsApp/ERP/KDS mostram o adicional.

### CT-05 - Multiplos Extras

Passos:

1. Abrir produto que aceita extras.
2. Adicionar carne, queijo, ovo e bacon.
3. Confirmar limites definidos.
4. Adicionar ao carrinho.
5. Finalizar pedido.

Esperado:

- limite de extras e respeitado;
- valores fecham corretamente;
- pedido nao falha ao registrar.

## Testes De Checkout E Pedido

### OD-01 - Checkout WhatsApp Desktop

Passos:

1. Montar carrinho.
2. Selecionar pagamento via WhatsApp.
3. Enviar pedido.
4. Observar a nova aba.

Esperado:

- pedido e registrado antes do redirecionamento;
- desktop abre WhatsApp Web ou link valido;
- tela nao fica presa em `about:blank`;
- usuario consegue continuar.

### OD-02 - Checkout WhatsApp Mobile

Passos:

1. Simular mobile.
2. Montar carrinho.
3. Selecionar pagamento via WhatsApp.
4. Enviar pedido.

Esperado:

- app/link do WhatsApp abre;
- usuario consegue retornar ao app;
- pedido permanece registrado.

### OD-03 - Pedido Com Dados Do Cliente

Passos:

1. Informar nome.
2. Informar telefone.
3. Informar endereco quando entrega estiver ativa.
4. Finalizar.

Esperado:

- dados obrigatorios sao validados;
- pedido salva dados corretos;
- admin consegue localizar pedido.

## Testes De Pagamento

### PG-01 - Mercado Pago Sandbox

Passos:

1. Selecionar Mercado Pago no checkout staging.
2. Criar pagamento usando credenciais sandbox.
3. Concluir fluxo com dados de teste.

Esperado:

- preferencia/pagamento e criado;
- usuario e redirecionado para pagina segura;
- nenhum pagamento real e gerado.

### PG-02 - Webhook Aprovado

Passos:

1. Simular ou concluir pagamento aprovado no sandbox.
2. Confirmar recebimento do webhook no backend staging.
3. Conferir status do pedido.

Esperado:

- webhook e validado;
- status do pagamento muda para aprovado;
- pedido nao duplica.

### PG-03 - Webhook Idempotente

Passos:

1. Reenviar o mesmo evento de webhook.
2. Conferir pedido e logs.

Esperado:

- evento repetido nao duplica pedido;
- status permanece consistente;
- log registra reprocessamento de forma controlada.

## Testes De Operacao

### KD-01 - Pedido Chega No KDS

Passos:

1. Criar pedido em staging.
2. Abrir KDS.
3. Conferir card do pedido.

Esperado:

- pedido aparece no KDS;
- itens e adicionais aparecem corretamente;
- total e observacoes aparecem quando aplicavel.

### KD-02 - Avanco De Status

Passos:

1. Abrir pedido no KDS/admin.
2. Avancar status.
3. Conferir atualizacao no frontend/admin.

Esperado:

- status muda corretamente;
- historico nao quebra;
- telas atualizam sem inconsistencia.

### KS-01 - Pedido Pelo Kiosk

Passos:

1. Abrir modo kiosk.
2. Criar pedido.
3. Conferir entrada no backend/admin.

Esperado:

- pedido e criado;
- origem kiosk e identificavel;
- fluxo nao interfere no delivery.

## Testes De Conta E Permissao

### AU-01 - Cadastro De Cliente

Passos:

1. Criar usuario cliente em staging.
2. Confirmar dados basicos.
3. Fazer login.

Esperado:

- cadastro funciona;
- senha nao aparece em log;
- login funciona.

### AU-02 - Sessao

Passos:

1. Login com usuario valido.
2. Recarregar pagina.
3. Acessar area protegida.
4. Sair.

Esperado:

- sessao persiste conforme regra;
- logout encerra acesso;
- token invalido nao acessa area protegida.

### AU-03 - Isolamento De Usuario

Passos:

1. Criar dois usuarios.
2. Criar pedido com o usuario A.
3. Logar com usuario B.
4. Verificar historico.

Esperado:

- usuario B nao ve dados privados do usuario A;
- admin ve apenas o que sua permissao permitir.

## Testes De Log E Seguranca

### LG-01 - Erro Controlado

Passos:

1. Gerar erro esperado com payload invalido.
2. Conferir resposta da API.
3. Conferir log.

Esperado:

- API retorna erro compreensivel;
- log tem diagnostico suficiente;
- nenhuma senha/token aparece.

### LG-02 - Ausencia De Secrets Em Logs

Passos:

1. Executar checkout.
2. Executar login.
3. Executar pagamento sandbox.
4. Conferir logs de backend.

Esperado:

- `JWT_SECRET` nao aparece;
- tokens Mercado Pago nao aparecem;
- token WhatsApp nao aparece;
- senha nao aparece.

## Criterio De Aprovacao

Homologacao P0 aprovada somente se:

- todos os testes P0 estiverem aprovados;
- nenhum bug critico estiver aberto;
- evidencia minima estiver registrada;
- staging estiver usando recursos isolados;
- rollback estiver documentado.

## Proxima Parte

Parte 8 - Go/No-Go de producao.

Objetivo:

- decidir se o sistema pode ir para producao;
- definir travas;
- definir rollback;
- registrar aprovacao.
