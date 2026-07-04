# Homologacao Menfi's Burger - Parte 8: Go/No-Go De Producao

## Objetivo

Definir o criterio final para liberar ou bloquear uma publicacao em producao.

Esta etapa nao publica nada. Ela cria a regra de decisao para evitar deploy com risco conhecido.

## Identificacao Da Release

Preencher antes da decisao:

```text
Data:
Responsavel:
Branch:
Commit:
Frontend staging:
Backend staging:
Banco staging:
Resultado dos testes P0:
```

## Condicoes Automaticas De No-Go

Nao liberar producao se qualquer item abaixo for verdadeiro:

- algum teste P0 reprovado;
- algum teste P0 bloqueado sem decisao formal;
- backend staging sem health check OK;
- frontend staging apontando para backend de producao durante teste;
- backend staging apontando para banco de producao;
- migration nao testada em staging;
- pagamento sandbox nao validado;
- webhook nao validado;
- pedido com adicional de carne falhando;
- pedido com adicional de frango falhando;
- checkout WhatsApp desktop travando;
- CORS falhando;
- secret real exposto em repo, log ou console;
- rollback nao definido.

## Condicoes Para Go

Liberar producao somente se:

- todos os P0 foram aprovados;
- staging esta isolado;
- migrations rodaram em staging;
- build backend passou;
- build frontend passou;
- health check passou;
- logs nao mostram secrets;
- rollback foi testado ou e operacionalmente claro;
- responsavel aprovou a janela de deploy.

## Plano De Deploy Seguro

Quando a decisao for Go:

1. Congelar alteracoes funcionais.
2. Confirmar branch e commit exatos.
3. Confirmar variaveis de producao sem alterar valores sensiveis desnecessariamente.
4. Fazer deploy backend.
5. Validar `GET /actuator/health`.
6. Fazer deploy frontend.
7. Validar home, cardapio, checkout e admin.
8. Criar pedido pequeno de validacao, se operacionalmente permitido.
9. Monitorar logs por pelo menos 30 minutos.

## Plano De Rollback

Antes de qualquer deploy, registrar:

```text
Ultimo deploy backend estavel:
Ultimo deploy frontend estavel:
Ultimo commit estavel:
Como voltar backend:
Como voltar frontend:
Quem executa rollback:
Tempo maximo para decisao:
```

Regras:

- se backend nao sobe, rollback imediato;
- se pedido nao registra, rollback imediato;
- se pagamento real quebra, rollback imediato;
- se cliente nao consegue finalizar pedido, rollback imediato;
- se erro for cosmetico e nao afetar compra, registrar e corrigir em proxima janela.

## Checklist Pos-Deploy

- [ ] Backend producao saudavel.
- [ ] Frontend producao abre.
- [ ] Frontend chama backend producao.
- [ ] Pedido simples registra.
- [ ] Pedido com adicional registra.
- [ ] WhatsApp abre corretamente.
- [ ] Mercado Pago responde.
- [ ] Admin/KDS mostra pedido.
- [ ] Logs sem erro critico.
- [ ] Logs sem secrets.
- [ ] Monitoramento acompanhando.

## Registro De Decisao

Modelo:

```text
Decisao: Go | No-Go
Data:
Responsavel:
Commit aprovado:
Motivo:
Pendencias:
Rollback definido: Sim | Nao
Observacoes:
```

## Saida Esperada

Ao final desta parte, deve existir uma decisao clara:

- `Go`: pode publicar seguindo plano seguro.
- `No-Go`: nao publicar; corrigir pendencias e repetir homologacao.

Sem essa decisao registrada, o sistema nao deve ser considerado homologado.
