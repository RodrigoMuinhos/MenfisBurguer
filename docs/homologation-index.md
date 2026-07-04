# Homologacao Menfi's Burger - Indice

## Objetivo

Organizar o plano de acao para deixar o sistema pronto para homologacao sem alterar producao durante a preparacao.

## Documentos

1. [Parte 1 - Isolamento](homologation-part-01-isolamento.md)
   - Define a regra de nao tocar em producao e separa o trabalho local/staging.

2. [Parte 2 - Inventario Tecnico](homologation-part-02-inventario-tecnico.md)
   - Mapeia frontend, backend, banco, pagamentos, filas, logs e pontos de risco.

3. [Parte 3 - Checklist De Staging](homologation-part-03-staging-checklist.md)
   - Lista os requisitos para criar um ambiente de homologacao isolado.

4. [Parte 4 - Matriz De Testes](homologation-part-04-matriz-testes.md)
   - Define os testes P0/P1/P2 e suas prioridades.

5. [Parte 5 - Execucao Local Da Fase 1](homologation-part-05-execucao-fase-1.md)
   - Registra as validacoes locais ja executadas.

6. [Parte 6 - Preparacao Do Staging](homologation-part-06-preparacao-staging.md)
   - Define recursos, variaveis e validacoes para staging isolado.

7. [Parte 7 - Execucao Dos Testes P0](homologation-part-07-execucao-testes-p0.md)
   - Roteiro operacional para testar os fluxos criticos.

8. [Parte 8 - Go/No-Go De Producao](homologation-part-08-go-no-go-producao.md)
   - Criterio final para liberar ou bloquear producao.

## Documento Complementar

[Roadmap Tecnico De Evolucao](technical-evolution-roadmap.md)

Esse documento organiza a evolucao maior do sistema por camadas:

- frontend;
- APIs e backend;
- banco e storage;
- auth e permissoes;
- deploy;
- cloud;
- CI/CD;
- seguranca;
- rate limiting;
- cache/CDN;
- escala;
- logs;
- disponibilidade.

## Sequencia Recomendada

1. Manter producao intocada.
2. Finalizar validacoes locais.
3. Criar staging isolado.
4. Rodar testes P0.
5. Corrigir falhas encontradas.
6. Repetir P0 ate aprovar.
7. Registrar Go/No-Go.
8. So entao planejar deploy de producao.

## Estado Atual

Preparacao local em andamento.

Producao nao foi alterada por este plano.
