# Menfi's Burguer

Aplicação Next.js para o restaurante Menfi's Burguer, com fluxo de pedido, painel da cozinha, dashboard e estoque.

## Rodando com Docker

1. Copie o arquivo de exemplo de ambiente:
   - `.env.example` → `.env.local`
2. Preencha `DATABASE_URL` com sua conexão PostgreSQL/Neon.
3. Suba o ambiente:
   - `docker compose up --build`
4. Abra a aplicação em:
   - `http://localhost:3000`

## Observações

- A aplicação usa `DATABASE_URL` para a rota `POST /api/customer`.
- O projeto foi configurado com `output: "standalone"` para gerar uma imagem Docker de produção menor e mais simples.
