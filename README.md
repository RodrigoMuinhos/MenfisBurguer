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
NEXT_PUBLIC_API_URL=<URL_PUBLICA_DO_BACKEND>
NEXT_PUBLIC_MP_PUBLIC_KEY=<PUBLIC_KEY_MERCADO_PAGO>
APP_BASE_URL=<URL_PUBLICA_DO_FRONTEND>
```

## Railway

Configure o servico Railway com:

- Root Directory: `backend`
- Dockerfile Path: `Dockerfile`
- Public Networking Port: `8080`

Variaveis do backend ficam no Railway, nao na Vercel:

```env
DATABASE_URL=<CONNECTION_STRING_PRIVADA>
MERCADO_PAGO_ACCESS_TOKEN=<TOKEN_PRIVADO_MERCADO_PAGO>
MP_ACCESS_TOKEN=<TOKEN_PRIVADO_MERCADO_PAGO>
FRONTEND_URL=<URL_PUBLICA_DO_FRONTEND>
BACKEND_URL=<URL_PUBLICA_DO_BACKEND>
JWT_SECRET=<SEGREDO_FORTE>
```

## Teste de backend

Depois do deploy, valide a saude do backend usando a URL publica configurada no provedor. Nao publique endpoints internos ou URLs sensiveis no repositorio.

Endpoints operacionais:

```text
GET /actuator/health
GET /swagger-ui.html
GET /v3/api-docs
```

## Docker local

Para rodar frontend e backend em containers locais:

```powershell
Copy-Item .env.docker.example .env.local
# Edite .env.local e preencha DATABASE_URL/JWT_SECRET e tokens opcionais.
docker compose --env-file .env.local up --build
```

URLs locais devem ficar apenas no arquivo `.env.local` da maquina de desenvolvimento. O frontend do container e compilado apontando para `NEXT_PUBLIC_API_URL`.

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

Pedidos usam `channel: DELIVERY | KIOSK` e os status canônicos definidos em
`frontend/src/types/order.ts`. O backend converte pedidos legados pela migração
`V9__canonical_order_channel_and_status.sql`.

O ADM possui o controle **Pagar na entrega**. A configuração é persistida no
backend; quando desligada, a opção desaparece do checkout delivery e a API
recusa novos pedidos com esse método.
