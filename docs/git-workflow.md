# Fluxo de Desenvolvimento Git

Este repositório utiliza `main` como producao e `develop` como integracao/homologacao. Nao faca commits ou pushes diretos para `main`.

## Branches permanentes

- `main`: representa a versao em producao. Recebe apenas pull requests aprovados de `develop`.
- `develop`: recebe pull requests de funcionalidades e correcoes que farao parte da proxima versao.

## Branches de trabalho

- `feature/<descricao>`: nova funcionalidade ou evolucao tecnica. Crie a partir de `develop` e abra PR para `develop`.
- `hotfix/<descricao>`: correcao urgente de producao. Crie a partir de `main`, abra PR para `main` e, depois do merge, propague a correcao para `develop` em um PR separado.

Exemplos: `feature/rbac-security`, `feature/github-actions`, `feature/staging`, `hotfix/pix-timeout`.

## Fluxo de funcionalidade

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/rbac-security

# trabalhar, testar e commitar
git push -u origin feature/rbac-security
```

Abra um pull request de `feature/rbac-security` para `develop`. O merge depende da aprovacao e dos checks obrigatorios.

Para atualizar uma branch de feature antes do merge:

```bash
git switch develop
git pull --ff-only origin develop
git switch feature/rbac-security
git merge develop
```

## Release

Quando as mudancas em `develop` estiverem homologadas, abra um pull request de `develop` para `main`. O deploy de producao parte exclusivamente do merge desse PR.

## Protecao obrigatoria no GitHub

Em **Settings > Branches**, crie regras para `main` e `develop`:

- exigir pull request antes de merge;
- exigir pelo menos uma aprovacao;
- exigir checks de status antes de merge (quando a CI estiver publicada);
- bloquear force push e exclusao da branch.

Para `main`, restrinja pushes diretos inclusive para administradores, quando a equipe e o plano do GitHub permitirem. Para `develop`, aplique as mesmas regras de PR e checks; a aprovacao pode seguir a politica da equipe.

## Regras operacionais

- Nunca use `git push origin main` ou `git push origin develop` para publicar commits de trabalho.
- Cada PR deve ter build relevante executado e uma descricao objetiva da mudanca e do risco.
- Nao misture hotfixes com evolucoes de arquitetura.
- Depois de um hotfix em `main`, mantenha `develop` sincronizada antes da proxima release.
