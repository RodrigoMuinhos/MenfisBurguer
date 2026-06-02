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

## Railway / produção

O backend atualmente precisa de **apenas uma variável de ambiente** no Railway:

- `DATABASE_URL` → URL do PostgreSQL do Railway/Neon

Exemplo de formato aceito:

- `postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require`
- ou `jdbc:postgresql://HOST/DBNAME?user=USER&password=PASSWORD&sslmode=require`

Observações importantes:

- Não há chave extra obrigatória para o backend hoje.
- `PORT` é fornecida automaticamente pelo Railway.
- O código já normaliza URL JDBC e conecta com SSL.
