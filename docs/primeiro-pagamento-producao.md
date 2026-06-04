# Primeiro pagamento real de R$ 1,00

O ambiente local usa credenciais de teste e sandbox. O ambiente de producao usa
somente credenciais de producao e URLs HTTPS reais.

## Railway

Configure no servico do backend:

```env
MENFIS_ENVIRONMENT=production
FRONTEND_URL=https://www.menfisburguer.com.br
BACKEND_URL=https://menfisburguer-production.up.railway.app
DATABASE_URL=<URL_DO_NEON>
MERCADO_PAGO_ACCESS_TOKEN=<ACCESS_TOKEN_DE_PRODUCAO>
MERCADO_PAGO_WEBHOOK_SECRET=<ASSINATURA_SECRETA_DO_WEBHOOK>
JWT_SECRET=<SEGREDO_FORTE>
```

O Railway normalmente fornece `RAILWAY_ENVIRONMENT_NAME=production`. Mesmo
assim, mantenha `MENFIS_ENVIRONMENT=production` explicito para evitar duvida.

Nao configure `MERCADO_PAGO_PAYER_EMAIL` nem
`MERCADO_PAGO_CARD_PAYER_EMAIL` com usuarios de teste em producao.

## Vercel

Configure no projeto com Root Directory `frontend`:

```env
NEXT_PUBLIC_API_URL=https://menfisburguer-production.up.railway.app
NEXT_PUBLIC_MP_PUBLIC_KEY=<PUBLIC_KEY_DE_PRODUCAO>
APP_BASE_URL=https://www.menfisburguer.com.br
```

## Webhook Mercado Pago

Configure a URL de producao:

```txt
https://menfisburguer-production.up.railway.app/payments/webhook/mercadopago
```

Selecione o evento `Order (Mercado Pago)` e salve a assinatura secreta gerada
em `MERCADO_PAGO_WEBHOOK_SECRET` no Railway.

## Validacao real

1. Faça deploy do backend no Railway.
2. Faça redeploy do frontend na Vercel.
3. Acesse `https://www.menfisburguer.com.br` em uma janela anonima.
4. Monte um pedido e aplique o cupom `marianazinha`. O total deve ficar R$ 1,00.
5. Escolha Pix ou cartao e pague com uma conta real diferente da conta
   vendedora.
6. Confirme que o pedido muda de pagamento pendente para aprovado e entra no
   KDS somente depois do webhook.

Nunca use usuario, cartao ou e-mail de teste nesse fluxo produtivo.
