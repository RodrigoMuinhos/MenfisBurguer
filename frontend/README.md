# Menfi's Burguer Frontend

Aplicacao Next.js do delivery Menfi's Burguer.

## Rodando local

```powershell
cd frontend
npm ci
npm run dev
```

Abra:

```txt
http://localhost:3000
```

## Variaveis

Use `.env.local` nesta pasta para desenvolvimento local:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...
APP_BASE_URL=http://localhost:3000
```

Em producao na Vercel:

```env
NEXT_PUBLIC_API_URL=https://menfisburguer-production.up.railway.app
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...
APP_BASE_URL=https://www.menfisburguer.com.br
```

## Deploy Vercel

Configure:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Install Command: `npm ci`

Segredos de backend como `DATABASE_URL`, `MERCADO_PAGO_ACCESS_TOKEN` e `JWT_SECRET` ficam somente no Railway.
