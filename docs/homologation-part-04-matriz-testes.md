# Homologacao Menfi's Burger - Parte 4: Matriz De Testes

## Objetivo

Definir os cenarios obrigatorios para considerar o sistema homologado.

Esta parte nao executa testes automaticamente, nao faz deploy e nao altera producao. Ela cria uma matriz para que cada fluxo seja validado com criterio claro.

## Regras Gerais

- Executar primeiro em staging.
- Usar dados ficticios.
- Registrar evidencias: print, horario, pedido, status e resultado.
- Nao seguir para producao se algum teste critico falhar.
- Em caso de erro, registrar:
  - ambiente;
  - usuario;
  - pedido;
  - payload quando seguro;
  - erro visual;
  - erro no console;
  - erro no log do backend.

## Legenda De Prioridade

| Prioridade | Significado |
|---|---|
| P0 | Bloqueia homologacao |
| P1 | Deve ser corrigido antes de producao |
| P2 | Pode virar melhoria pos-homologacao |

## 1. Smoke Test De Ambiente

### ST-01 - Backend Saudavel

Prioridade: P0

Passos:

1. Acessar `GET /actuator/health`.
2. Acessar `GET /settings/public`.

Resultado esperado:

- `/actuator/health` retorna `200`.
- `/settings/public` retorna `200`.
- Backend nao apresenta crash nos logs.

### ST-02 - Frontend Abre

Prioridade: P0

Passos:

1. Abrir frontend staging.
2. Abrir console do navegador.
3. Navegar pela home, menu e carrinho.

Resultado esperado:

- Pagina carrega.
- Nao ha erro critico no console.
- Cardapio aparece.
- Carrinho abre.

### ST-03 - CORS

Prioridade: P0

Passos:

1. No frontend staging, chamar `/settings/public`.
2. Abrir aba Network.

Resultado esperado:

- Requisicao passa.
- Nao ha erro de CORS.
- Backend retorna payload valido.

## 2. Cardapio E Carrinho

### CT-01 - Produto Simples

Prioridade: P0

Passos:

1. Adicionar um burger simples.
2. Abrir carrinho.

Resultado esperado:

- Item aparece no carrinho.
- Quantidade correta.
- Total visual calculado.

### CT-02 - Combo Com Bebida

Prioridade: P0

Passos:

1. Adicionar combo.
2. Escolher bebida.
3. Confirmar.
4. Abrir carrinho.

Resultado esperado:

- Combo aparece no carrinho.
- Componentes aparecem corretamente.
- Total visual inclui alteracoes esperadas.

### CT-03 - Adicional De Carne

Prioridade: P0

Passos:

1. Abrir um burger bovino.
2. Selecionar `Adicional de carne`.
3. Confirmar item.
4. Abrir carrinho.

Resultado esperado:

- Item principal aparece com adicional nos componentes.
- Total inclui adicional.
- Extra nao quebra criacao do pedido.

### CT-04 - Adicional De Frango

Prioridade: P0

Passos:

1. Abrir um produto chicken.
2. Selecionar `Adicional de frango`.
3. Confirmar item.
4. Abrir carrinho.

Resultado esperado:

- Item principal aparece com adicional nos componentes.
- Total inclui adicional.
- Extra nao quebra criacao do pedido.

### CT-05 - Extra Avulso

Prioridade: P1

Passos:

1. Abrir aba Extras.
2. Adicionar maionese, ovo, queijo, carne ou frango.
3. Abrir carrinho.

Resultado esperado:

- Extra aparece como item avulso.
- Pedido pode ser criado.
- Backend reconhece o produto.

## 3. Checkout Delivery

### OD-01 - Pedido WhatsApp

Prioridade: P0

Passos:

1. Criar carrinho com produto simples.
2. Informar dados de entrega.
3. Escolher `Pagar pelo WhatsApp`.
4. Finalizar.

Resultado esperado:

- `POST /orders` retorna sucesso.
- Pedido e criado no backend.
- WhatsApp abre com resumo.
- Pedido aparece no tracking/admin.

### OD-02 - Pedido Com Adicionais

Prioridade: P0

Passos:

1. Criar pedido com adicional de carne ou frango.
2. Finalizar pelo WhatsApp.

Resultado esperado:

- Pedido e criado.
- Backend recalcula total.
- Nao ocorre `404 not_found`.
- Adicional aparece no pedido/admin/KDS.

### OD-03 - Pedido Com Cupom

Prioridade: P1

Passos:

1. Criar carrinho.
2. Aplicar cupom valido.
3. Finalizar.

Resultado esperado:

- Desconto aparece.
- Backend valida cupom.
- Total final correto.

### OD-04 - Restaurante Fechado Ou Sold Out

Prioridade: P1

Passos:

1. Simular configuracao fechado ou sold out em staging.
2. Tentar finalizar pedido.

Resultado esperado:

- Pedido nao e criado indevidamente.
- Cliente recebe mensagem clara.
- Nao abre pagamento indevido.

## 4. Pagamentos

### PG-01 - Mercado Pago Checkout

Prioridade: P0

Passos:

1. Criar pedido com Mercado Pago.
2. Confirmar redirecionamento.
3. Simular retorno aprovado.

Resultado esperado:

- Checkout abre.
- Pedido fica pendente ate aprovacao.
- Retorno identifica pedido.

### PG-02 - Webhook Aprovado

Prioridade: P0

Passos:

1. Enviar webhook aprovado em staging.
2. Verificar pedido.

Resultado esperado:

- Webhook e validado.
- Pedido muda para pagamento aprovado.
- Evento para cozinha e publicado.
- Webhook duplicado nao duplica processamento.

### PG-03 - Pix Direto Menfi's

Prioridade: P1

Passos:

1. Escolher Pix direto.
2. Finalizar pedido.

Resultado esperado:

- QR/codigo Pix aparece.
- Pedido fica aguardando validacao.
- Comprovante pode ser enviado conforme fluxo previsto.

## 5. Admin E KDS

### KD-01 - Pedido Entra No KDS

Prioridade: P0

Passos:

1. Criar pedido aprovado ou presencial.
2. Abrir KDS.

Resultado esperado:

- Pedido aparece na fila correta.
- Ordem respeita criacao/confirmacao.

### KD-02 - Avanco De Status

Prioridade: P0

Passos:

1. Avancar pedido no KDS.
2. Verificar tracking.
3. Verificar admin.

Resultado esperado:

- Status muda na sequencia correta.
- Tracking atualiza.
- Historico e registrado.

### KD-03 - Transicao Invalida

Prioridade: P1

Passos:

1. Tentar pular etapa invalida via API/admin.

Resultado esperado:

- Backend bloqueia.
- Erro claro.
- Status anterior permanece.

## 6. Kiosk / PDV

### KS-01 - Pedido Presencial

Prioridade: P0

Passos:

1. Abrir modo kiosk.
2. Criar pedido presencial.
3. Escolher pagamento no balcao/presencial.
4. Finalizar.

Resultado esperado:

- Pedido sem frete.
- Pedido entra no backend.
- Pedido aparece no KDS.
- Cliente nao passa por pagamento online.

### KS-02 - Sessao Kiosk

Prioridade: P1

Passos:

1. Abrir kiosk.
2. Atualizar pagina.
3. Continuar uso.

Resultado esperado:

- Kiosk nao perde configuracao critica.
- Nao exige login indevido.

## 7. Cliente E Sessao

### AU-01 - Cadastro Cliente

Prioridade: P0

Passos:

1. Criar perfil cliente.
2. Fazer pedido.

Resultado esperado:

- Cliente loga.
- Token e salvo.
- Pedido fica associado ao cliente.

### AU-02 - Login Cliente

Prioridade: P0

Passos:

1. Entrar com cliente existente.
2. Atualizar pagina.

Resultado esperado:

- Sessao permanece conforme regra.
- Cliente ve seus pedidos.

### AU-03 - Cliente Nao Ve Pedido De Outro Cliente

Prioridade: P0

Passos:

1. Logar cliente A.
2. Criar pedido.
3. Logar cliente B.
4. Tentar acessar pedidos de A.

Resultado esperado:

- Cliente B nao acessa dados de A.

## 8. LGPD

### LG-01 - Paginas Publicas

Prioridade: P1

Passos:

1. Abrir politica de privacidade.
2. Abrir termos.
3. Abrir exclusao de dados.

Resultado esperado:

- Paginas carregam.
- Texto e compreensivel.
- Cliente sabe como solicitar exclusao.

### LG-02 - Dados Sensiveis Em Logs

Prioridade: P0

Passos:

1. Fazer login.
2. Recuperar senha.
3. Criar pedido.
4. Revisar logs.

Resultado esperado:

- Logs nao mostram senha.
- Logs nao mostram token.
- Logs nao mostram CPF completo.
- Logs nao mostram codigo de recuperacao.

## 9. Observabilidade E Falhas

### OB-01 - Erro De Backend

Prioridade: P1

Passos:

1. Forcar erro controlado em staging.
2. Verificar resposta da API.
3. Verificar logs.

Resultado esperado:

- Cliente recebe mensagem segura.
- Log contem contexto tecnico suficiente.
- Dado sensivel nao aparece.

### OB-02 - RabbitMQ Indisponivel

Prioridade: P1

Passos:

1. Simular RabbitMQ indisponivel em staging.
2. Aprovar pedido.

Resultado esperado:

- Backend registra erro.
- Pedido nao some.
- Existe caminho de recuperacao/reprocessamento.

## Criterio De Homologacao

O sistema pode seguir para producao quando:

- todos os testes P0 passarem;
- falhas P1 tiverem correcao ou decisao formal;
- falhas P2 estiverem registradas como melhorias;
- evidencias estiverem salvas;
- rollback estiver definido.

## Proxima Parte

Parte 5 - Execucao guiada da Fase 1.

Objetivo:

- transformar os testes P0 em checklist executavel;
- preparar scripts ou comandos locais seguros;
- validar build, migrations e fluxo basico sem tocar em producao.
