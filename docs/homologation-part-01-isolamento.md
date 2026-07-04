# Homologacao Menfi's Burger - Parte 1: Isolamento Seguro

## Objetivo

Preparar o projeto para evoluir e testar sem afetar o ambiente de producao.

Esta parte nao muda regra de negocio, nao altera banco remoto, nao faz deploy e nao mexe em variaveis da Vercel, Railway ou Neon. O foco e criar uma base segura para trabalhar por etapas.

## Principio Principal

Producao nao deve ser usada como ambiente de teste.

Toda mudanca deve passar por um ambiente isolado antes de chegar ao cliente real. Isso evita:

- queda do site em horario de venda;
- migrations quebrando o backend;
- pedidos de teste misturados com pedidos reais;
- webhooks falsos ou duplicados afetando pedidos reais;
- alteracoes de preco/cardapio impactando cliente sem validacao;
- perda de rastreabilidade quando algo falha.

## Ambientes Recomendados

### Local

Usado para desenvolvimento rapido na maquina.

Finalidade:

- alterar codigo;
- testar fluxo basico;
- rodar build;
- rodar testes automatizados;
- validar migrations em banco local ou banco de teste.

Nao deve usar:

- banco de producao;
- token real do Mercado Pago, exceto quando for teste controlado;
- webhook publico de producao;
- URL publica oficial do cliente.

### Staging

Ambiente de homologacao antes da producao.

Finalidade:

- simular operacao real;
- validar deploy;
- validar migrations;
- testar checkout;
- testar KDS;
- testar kiosk;
- testar Mercado Pago em sandbox ou conta controlada;
- testar WhatsApp sem impactar cliente real.

Deve ter:

- backend separado;
- banco separado;
- variaveis separadas;
- URL separada;
- logs separados;
- dados ficticios.

### Production

Ambiente real do Menfi's Burger.

Finalidade:

- receber pedidos reais;
- operar cozinha;
- operar admin;
- processar pagamentos reais;
- atender clientes reais.

Regra:

- nao testar alteracao nova diretamente aqui;
- nao rodar script manual sem checklist;
- nao alterar variavel sem registrar;
- nao aplicar migration sem ter validado em staging.

## Checklist Da Parte 1

Antes de qualquer fase tecnica, confirmar:

- [ ] Existe backup local da pasta do projeto.
- [ ] Existe branch ou copia isolada para trabalho.
- [ ] Producao esta identificada e nao sera alterada diretamente.
- [ ] Variaveis de producao nao serao copiadas para arquivos versionados.
- [ ] Banco de producao nao sera usado para testes destrutivos.
- [ ] Railway/Vercel de producao nao serao redeployados sem decisao explicita.
- [ ] Qualquer commit/push sera feito apenas quando solicitado.
- [ ] Toda migration nova tera numero unico de Flyway.
- [ ] Toda mudanca sera validada com build local antes de deploy.

## O Que Sera Feito Nesta Parte

1. Criar documentacao de isolamento.
2. Registrar regras para nao tocar em producao durante a homologacao.
3. Definir criterio para seguir para a Parte 2.

## O Que Nao Sera Feito Nesta Parte

- Nao criar migration.
- Nao alterar regra de pedido.
- Nao alterar pagamento.
- Nao alterar login.
- Nao alterar RabbitMQ.
- Nao fazer deploy.
- Nao fazer commit/push automaticamente.
- Nao alterar variaveis remotas.

## Criterio De Conclusao

Esta parte esta concluida quando:

- o plano de isolamento esta documentado;
- o time sabe quais ambientes existem;
- producao esta explicitamente protegida;
- existe acordo de que proximas alteracoes serao feitas em partes pequenas.

## Proxima Parte

Parte 2 - Inventario tecnico do sistema.

Objetivo da Parte 2:

- mapear frontend, backend, banco, deploy, pagamentos, auth e filas;
- listar o que ja existe;
- listar riscos atuais;
- priorizar o que deve ser corrigido primeiro para homologacao.
