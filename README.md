# Menfis Burguer

Monorepo do delivery Menfis Burguer.

## Estrutura

- `frontend/` - Next.js, TypeScript e Tailwind. Deploy na Vercel.
- `backend/` - Java Spring Boot. Deploy no Railway.
- `docs/` - arquitetura e notas operacionais.

## Vercel

Configure o projeto Vercel com:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output: padrao do Next.js

Variaveis do frontend:

```env
NEXT_PUBLIC_API_URL=https://menfisburguer-production.up.railway.app
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-dc31a91c-3aef-4128-92b8-8359b01ba106
APP_BASE_URL=https://www.menfisburguer.com.br
```

## Railway

Configure o servico Railway com:

- Root Directory: `backend`
- Dockerfile Path: `Dockerfile`
- Public Networking Port: `8080`

Variaveis do backend ficam no Railway, nao na Vercel:

```env
DATABASE_URL=postgresql://...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MP_ACCESS_TOKEN=APP_USR-...
FRONTEND_URL=https://www.menfisburguer.com.br
BACKEND_URL=https://menfisburguer-production.up.railway.app
JWT_SECRET=...
```

## Teste de backend

Depois do deploy Railway, esta URL deve retornar JSON:

```txt
https://menfisburguer-production.up.railway.app/dashboard/summary
```

Se retornar uma pagina HTML 404 do Next, o Railway ainda esta apontando para o frontend ou para a raiz errada.
