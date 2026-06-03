# Menfis Burguer Delivery UI Roadmap

## Fluxo Principal

Cliente:

1. Cardapio
2. Customizacao do produto
3. Sacola
4. Dados de entrega
5. Pagamento
6. Revisao final
7. Pix Mercado Pago
8. Acompanhamento do pedido

Operacao:

1. Backend registra pedido
2. Mercado Pago confirma pagamento por webhook
3. KDS recebe apenas pedido pago
4. Cozinha atualiza status
5. Dashboard mede vendas e tempos
6. Estoque baixa insumos

## Padrao de Tela

O frontend exibe e guia. O backend decide preco, status e pagamento.

- `ProductDetailModal`: escolhas obrigatorias e opcionais.
- `OptionGroup`: grupo com regra `min` e `max`.
- `CartScreen`: funil com dados, pagamento e revisao.
- `PaymentSelector`: Pix como primeira opcao.
- `TrackingScreen`: status claro para o cliente.
- `KdsOrderCard`: pedido aprovado e pronto para cozinha.

## Prioridades

1. Modal de customizacao completo, com burger, molho, bebida, extras e observacao.
2. Checkout em etapas reais, sem botao bloqueado sem explicacao.
3. Tela de pagamento integrada ao Mercado Pago.
4. Tela de acompanhamento apos retorno do pagamento.
5. KDS usando pedidos pagos do backend.

## Regras de Produto

- Produto com escolhas obrigatorias nao entra direto na sacola.
- Botao `Adicionar` so ativa quando obrigatorios forem preenchidos.
- Extras opcionais somam no preco antes de adicionar.
- Observacao nao altera preco.
- O backend recalcula tudo ao criar o pedido.

## Regras de Pagamento

- Pix e cartao online passam pelo Mercado Pago.
- Pedido online nasce como `PENDING_PAYMENT`.
- Webhook aprovado muda pedido para `RECEIVED`.
- KDS nao deve produzir pedido com pagamento pendente.

## Infra

- Vercel roda apenas `frontend/`.
- Railway roda apenas `backend/`.
- Neon guarda o PostgreSQL.
- Mercado Pago chama `BACKEND_URL/payments/webhook/mercadopago`.
