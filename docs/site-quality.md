# Site, SEO e qualidade — Menfi’s Burguer

## Arquitetura

- `frontend/`: Next.js 15, App Router, React, TypeScript e Tailwind CSS.
- `backend/`: Spring Boot, Java 21, PostgreSQL/Flyway e RabbitMQ.
- O navegador acessa o Spring pelo proxy Next `/backend/*`.
- As rotas Next `/api/orders*` e `/api/customer` são legadas e precisam ser
  removidas em uma fase de segurança própria, após homologação.

## Rotas públicas indexáveis

| Rota | Finalidade |
|---|---|
| `/` | Cardápio e início do pedido |
| `/menfisbuffet` | Apresentação pública do buffet |
| `/politica-de-privacidade` | Política de privacidade |
| `/termos-de-servico` | Termos de serviço |
| `/exclusao-de-dados` | Instruções de exclusão de dados |

## Rotas não indexáveis

- `/adm`: administração e login administrativo.
- `/kds`: painel da cozinha.
- `/notas`: conferência interna.
- `/entrega`: login e rota do entregador.
- `/relatorios/*`: relatórios internos.
- `/api/*` e `/backend/*`: APIs e proxy técnico.

Carrinho, checkout e acompanhamento são estados internos da página inicial e
não recebem URLs canônicas próprias.

## Configuração pública do negócio

Dados públicos e não sensíveis ficam em `frontend/src/config/business.ts`.
Não adicionar nesse arquivo tokens, senhas, chaves de pagamento, URLs privadas
ou dados de clientes.

Dados atualmente confirmados no projeto:

- marca: Menfi’s Burguer;
- domínio: `https://www.menfisburguer.com.br`;
- atendimento: Fortaleza, Ceará;
- WhatsApp: `(85) 99788-3764`;
- modalidades: delivery e retirada.

Endereço, horário fixo, avaliações e faixa de preço não foram centralizados
porque não há uma fonte estática confiável para esses dados.

## SEO

- `src/app/robots.ts`: regras de rastreamento e referência ao sitemap.
- `src/app/sitemap.ts`: somente páginas públicas canônicas.
- `src/config/metadata.ts`: metadata reutilizável das páginas públicas.
- `src/config/internalMetadata.ts`: `noindex` para páginas internas.
- `src/components/seo/StructuredData.tsx`: JSON-LD de `Organization` e
  `WebSite`, sem avaliações ou informações comerciais inventadas.

O cardápio ainda é carregado majoritariamente no cliente. Uma futura fase pode
criar uma representação pública renderizada no servidor, com fallback seguro,
sem mover regras de carrinho, preço ou checkout para a camada SEO.

## Open Graph

A imagem atual é o logo oficial `public/logo_M.jpeg`, com 1254 × 1254 pixels.
Uma imagem social dedicada pode ser criada futuramente:

- arquivo recomendado: `public/og/menfis-burguer-fortaleza.jpg`;
- dimensão recomendada: 1200 × 630;
- conteúdo: logo legível e fotografia oficial de produto;
- não substituir a imagem atual até existir um arquivo aprovado pela marca.

## Analytics

O projeto possui Meta Pixel. Não foram encontrados Google Analytics ou Google
Tag Manager. Eventos não podem enviar nome, telefone, endereço, e-mail ou ID
capaz de identificar diretamente um cliente.

`purchase` só deve ser emitido após confirmação válida de pagamento ou da
operação definida pelo negócio.

## Google Search Console

1. Definir `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` no ambiente de produção.
2. Fazer novo deploy controlado.
3. Validar a propriedade de domínio no Search Console.
4. Enviar `https://www.menfisburguer.com.br/sitemap.xml`.
5. Testar `https://www.menfisburguer.com.br/robots.txt`.
6. Inspecionar a home e as páginas legais.
7. Conferir páginas excluídas e Core Web Vitals.
8. Se uma URL de pedido aparecer no índice, corrigir primeiro o `noindex` e a
   exposição da rota; depois usar a remoção temporária do Search Console.

## Google Business Profile

Conferência manual, sem alteração automática:

- [ ] Nome idêntico a Menfi’s Burguer.
- [ ] Domínio oficial com `www`.
- [ ] Telefone e WhatsApp conferidos.
- [ ] Área atendida compatível com Fortaleza.
- [ ] Horários conferidos com a operação real.
- [ ] Endereço exibido somente se houver atendimento público confirmado.
- [ ] Link do cardápio apontando para a página canônica.
- [ ] Link de pedido sem parâmetros temporários.

## PWA

O projeto possui manifest, mas não possui service worker. Portanto, não deve ser
descrito como aplicação offline. Dados de carrinho, checkout, pagamento,
pedidos ou respostas autenticadas não devem ser adicionados a cache de service
worker sem uma política de segurança específica.

## Segurança

O diagnóstico detalhado está em `docs/security/`. Itens prioritários:

- retirar acessos diretos do Next ao PostgreSQL;
- remover credencial administrativa padrão;
- substituir `permitAll` por autorização explícita;
- proteger pedidos por ownership;
- retirar JWT do `localStorage`;
- autenticar webhooks;
- restringir CORS;
- atualizar dependências vulneráveis.

Essas mudanças afetam autenticação, pedidos e pagamentos. Devem ser executadas
em fases separadas, com testes negativos, homologação e plano de reversão.

## Variáveis de ambiente

Exemplo sem valores reais:

```env
NEXT_PUBLIC_API_URL=https://api.exemplo.com
BACKEND_URL=https://api.exemplo.com
NEXT_PUBLIC_MP_PUBLIC_KEY=exemplo
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=exemplo
```

Segredos como `DATABASE_URL`, `JWT_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN` e
`WHATSAPP_ACCESS_TOKEN` pertencem ao backend/servidor e nunca devem receber o
prefixo `NEXT_PUBLIC_`.

## Validação local

```powershell
cd frontend
npm run typecheck
npm run test:seo
npm run build

cd ..\backend
mvn test
```

O projeto ainda não possui ESLint configurado; `lint` não deve ser reportado
como aprovado enquanto uma configuração real não for adicionada.

## Checklist antes do deploy

- [ ] Revisar o diff e excluir alterações não relacionadas.
- [ ] Confirmar que nenhum secret foi versionado.
- [ ] Executar testes SEO, typecheck, testes backend e build.
- [ ] Conferir canonical, robots, sitemap e JSON-LD.
- [ ] Testar cardápio, carrinho, checkout e acompanhamento em homologação.
- [ ] Testar Mercado Pago sem pagamento real.
- [ ] Verificar WhatsApp e links externos.
- [ ] Confirmar `noindex` em administração, KDS, entrega e relatórios.
- [ ] Fazer backup e plano de reversão para qualquer mudança transacional.

## Checklist após o deploy

- [ ] Abrir `/robots.txt` e `/sitemap.xml` no domínio oficial.
- [ ] Inspecionar metadata e canonical da home.
- [ ] Validar JSON-LD no Rich Results Test ou Schema Markup Validator.
- [ ] Conferir que páginas internas retornam `noindex`.
- [ ] Verificar erros no navegador e logs sem dados pessoais.
- [ ] Testar a jornada de pedido sem concluir pagamento real.
- [ ] Acompanhar erros, conversão e Core Web Vitals.
