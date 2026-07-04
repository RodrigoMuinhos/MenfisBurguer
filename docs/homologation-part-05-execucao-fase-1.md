# Homologacao Menfi's Burger - Parte 5: Execucao Guiada Da Fase 1

## Objetivo

Executar as validacoes locais basicas da Fase 1 sem tocar em producao.

Esta parte serve para provar que o projeto esta em uma base minimamente segura para seguir para testes funcionais em staging.

## O Que Esta Fase Valida

- estado do Git;
- duplicidade de migrations Flyway;
- build do backend;
- build do frontend;
- presenca de arquivos sensiveis versionados;
- preparacao para criar staging sem mexer em producao.

## O Que Esta Fase Nao Faz

- nao faz deploy;
- nao faz commit;
- nao faz push;
- nao altera Railway;
- nao altera Vercel;
- nao altera Neon;
- nao roda migration em banco remoto;
- nao chama Mercado Pago real;
- nao chama WhatsApp Cloud API real.

## Checklist De Execucao Local

### 1. Conferir estado do Git

Comando:

```powershell
git status -sb
```

Resultado esperado:

- Saber exatamente quais arquivos estao modificados.
- Nao seguir se houver mudanca desconhecida ou fora do escopo.

### 2. Conferir migrations duplicadas

Comando:

```powershell
Get-ChildItem backend/src/main/resources/db/migration |
  Group-Object { if ($_.Name -match '^V([^_]+)__') { $Matches[1] } else { $_.Name } } |
  Where-Object Count -gt 1
```

Resultado esperado:

- Nenhuma linha retornada.
- Se retornar algo, ha versao Flyway duplicada e o backend pode crashar no deploy.

### 3. Build do backend

Comando:

```powershell
cd backend
mvn -q -DskipTests package
```

Resultado esperado:

- Build finaliza com exit code `0`.
- Jar e gerado em `backend/target`.

### 4. Build do frontend

Comando:

```powershell
cd frontend
npm run build
```

Resultado esperado:

- Next.js compila.
- TypeScript passa.
- Rotas sao geradas.
- Nenhum erro bloqueante.

### 5. Verificar arquivos sensiveis

Comandos sugeridos:

```powershell
git status -sb
rg -n "MERCADO_PAGO_ACCESS_TOKEN|JWT_SECRET|DATABASE_URL|WHATSAPP_ACCESS_TOKEN|password=" .
```

Resultado esperado:

- Nenhum secret real versionado.
- Apenas exemplos, documentacao ou placeholders.

## Registro De Resultado

Execucao local realizada em 2026-07-02.

```text
Data: 2026-07-02
Ambiente: local
Branch: main
Commit base: origin/main

Git status: existem alteracoes locais documentais e configuracao local pendentes.
Migrations duplicadas: nenhuma duplicidade encontrada.
Backend build: aprovado com mvn -q -DskipTests package.
Frontend build: aprovado com npm run build.
Secrets no repo: apenas placeholders/documentacao encontrados; nenhum token real identificado.

Observacoes: producao nao foi alterada; nenhum deploy, commit, push ou migration remota foi executado.
```

## Registro De Resultado Automatizado

Execucao local realizada em 2026-07-02 as 12:00.

Comando:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\homologation-local-check.ps1
```

Resultado:

```text
Migrations duplicadas: aprovado.
Busca de possiveis secrets: apenas placeholders/documentacao e referencias de codigo para campo password.
Backend build: aprovado.
Frontend build: aprovado.
Producao: nao alterada.
Deploy: nao executado.
Commit/push: nao executado.
```

Script criado:

```text
scripts/homologation-local-check.ps1
```

Esse script pode ser repetido antes de qualquer rodada de staging para garantir que a base local ainda compila e nao possui versao Flyway duplicada.

## Criterio Para Avancar

Pode seguir para a Parte 6 quando:

- backend compila;
- frontend compila;
- migrations nao possuem versao duplicada;
- nao ha secret real no repo;
- o estado do Git esta compreendido;
- producao permanece intocada.

## Proxima Parte

Parte 6 - Preparacao do ambiente staging.

Objetivo:

- listar exatamente quais recursos criar;
- separar Vercel staging, Railway staging, Neon staging e RabbitMQ staging;
- definir nomes de variaveis;
- montar checklist para validar deploy de staging.
