# Testes Mercado Pago

Este roteiro serve para testar a integracao local sem usar cartao real.

## Contas

Use contas separadas:

- Vendedor: conta vinculada a aplicacao e ao Access Token.
- Comprador: usuario de teste usado para simular a compra.

O comprador e o vendedor precisam ser do mesmo pais. Nao teste comprando com a propria conta vendedora, porque o Mercado Pago pode bloquear ou desabilitar o botao de pagamento.

## Localhost

Variaveis locais esperadas:

```env
APP_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_MP_PUBLIC_KEY=<PUBLIC_KEY_DE_TESTE>
MERCADO_PAGO_ACCESS_TOKEN=<ACCESS_TOKEN_DE_TESTE>
MP_ACCESS_TOKEN=<ACCESS_TOKEN_DE_TESTE>
```

Para Pix via API Orders, o backend cria a order diretamente na API do Mercado Pago e retorna o QR Code/copia e cola.

Para cartao no fluxo atual, o backend abre o Checkout Mercado Pago em sandbox. O e-mail de pagador de teste usado no payload e `test@testuser.com`.

## Cartoes de teste

| Tipo | Bandeira | Numero | CVV | Validade |
| --- | --- | --- | --- | --- |
| Credito | Mastercard | 5031 4332 1540 6351 | 123 | 11/30 |
| Credito | Visa | 4235 6477 2802 5682 | 123 | 11/30 |
| Credito | American Express | 3753 651535 56885 | 1234 | 11/30 |
| Debito | Elo | 5067 7667 8388 8311 | 123 | 11/30 |

## Resultado do pagamento

O Mercado Pago usa o nome do titular para simular o resultado:

| Resultado | Nome do titular | CPF |
| --- | --- | --- |
| Aprovado | APRO | 12345678909 |
| Erro geral | OTHE | 12345678909 |
| Pendente | CONT | 12345678909 |
| Saldo insuficiente | FUND | 12345678909 |
| Codigo de seguranca invalido | SECU | 12345678909 |

## Webhook local

Mercado Pago nao chama `localhost` diretamente. Para testar aprovacao automatica local por webhook, exponha o backend com HTTPS publico, por exemplo via ngrok, e configure:

```env
BACKEND_URL=https://<seu-tunnel>
```

Depois use a URL:

```text
https://<seu-tunnel>/payments/webhook/mercadopago
```
