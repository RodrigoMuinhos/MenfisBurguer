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

## Totem Electron

O modo totem leva a interface kiosk dentro do executavel, abre em tela cheia e oferece somente:

- retirada na loja;
- pagamento presencial com a mensagem "Nosso atendente vai ate voce";
- envio do pedido para o KDS aguardando confirmacao manual do atendente.

Antes de entregar um novo executavel, publique o backend. Depois gere o arquivo portatil:

```powershell
cd frontend
npm run build:kiosk
```

Saida: `frontend/dist-electron/Menfis-Burger-Totem-0.0.6.exe`.

No totem, `Ctrl+Shift+Q` encerra a aplicacao.

Cinco cliques rapidos no logotipo tentam abrir o ADM. Quando o executavel do ADM
esta na mesma pasta, ele e aberto. Sem o ADM disponivel, o totem mostra
"Configuracao nao habilitada" e continua no autoatendimento.

### Teste local sem rebuild

Durante o desenvolvimento, teste primeiro no navegador local com recarregamento automatico:

```powershell
cd frontend
npm run dev:kiosk
```

Para abrir somente o ADM:

```powershell
cd frontend
npm run dev:admin
```

So execute `npm run build:kiosk` depois que o fluxo local estiver aprovado.

### Dois executaveis

Os aplicativos sao independentes e se comunicam pelo mesmo backend:

- `Menfis-Burger-Totem-0.0.6.exe`: somente autoatendimento.
- `Menfis-Burger-ADM-0.0.3.exe`: somente login e painel administrativo.

Gere os dois com:

```powershell
cd frontend
npm run build:apps
```

### Rotas da aplicacao

- `/delivery`: canal web com pagamento Mercado Pago.
- `/kiosk`: canal presencial.
- `/adm`: painel administrativo.
- `/kds`: acesso direto ao quadro da cozinha.

Pedidos usam `channel: DELIVERY | KIOSK` e os status canônicos definidos em
`frontend/src/types/order.ts`. O backend converte pedidos legados pela migração
`V9__canonical_order_channel_and_status.sql`.

O ADM possui o controle **Pagar na entrega**. A configuração é persistida no
backend; quando desligada, a opção desaparece do checkout delivery e a API
recusa novos pedidos com esse método.
