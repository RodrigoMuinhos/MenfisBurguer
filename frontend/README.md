# Menfi's Burguer Frontend

Aplicacao Next.js do delivery Menfi's Burguer.

## Rodando local

```powershell
cd frontend
npm ci
npm run dev
```

Abra a URL local indicada pelo servidor de desenvolvimento.

## Variaveis

Use `.env.local` nesta pasta para desenvolvimento local:

```env
NEXT_PUBLIC_API_URL=<URL_LOCAL_OU_PUBLICA_DO_BACKEND>
NEXT_PUBLIC_MP_PUBLIC_KEY=<PUBLIC_KEY_MERCADO_PAGO>
APP_BASE_URL=<URL_LOCAL_OU_PUBLICA_DO_FRONTEND>
```

Em producao na Vercel:

```env
NEXT_PUBLIC_API_URL=<URL_PUBLICA_DO_BACKEND>
NEXT_PUBLIC_MP_PUBLIC_KEY=<PUBLIC_KEY_MERCADO_PAGO>
APP_BASE_URL=<URL_PUBLICA_DO_FRONTEND>
```

## Deploy Vercel

Configure:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Install Command: `npm ci`

Segredos de backend como `DATABASE_URL`, `MERCADO_PAGO_ACCESS_TOKEN` e `JWT_SECRET` ficam somente no Railway.
