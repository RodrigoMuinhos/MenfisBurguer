# Restauração das alterações do evento

Data: 07/10/2026.

Pedido: voltar ao funcionamento anterior a 26/09, preservando as alterações do kiosk.

Foram restaurados o cardápio, o QR Code acessível pelo logo e a apresentação
configurável de descanso. A tela com imagens de `/event/` deixou de ser usada.
O fluxo Pix do kiosk introduzido no commit `2c9b0fd` foi preservado, assim como
a proteção para que a tela de descanso não interrompa o pagamento.

Os preços locais de hambúrgueres e combos voltaram aos valores anteriores ao
aumento de R$ 5. A migração V99 desfaz o aumento de V94 no banco, preservando
o histórico do Flyway. Ela só será aplicada quando o backend atualizado iniciar;
nenhum banco remoto foi alterado durante esta restauração.

As mudanças de checkout, PIN e recuperação de pedidos documentadas como
publicadas entre 04/09 e 06/09 foram preservadas. As alterações locais de
segurança, infraestrutura e impressão também foram preservadas.

Backup das alterações locais anteriores à restauração:
`C:/Users/RODRIGO/Desktop/menfis-backup-restauracao-20261007-210916`.

Validação: TypeScript, build de produção (20 páginas) e 17 testes de checkout,
PIN e SEO aprovados.
Frontend publicado em 07/10/2026 na Vercel:
`menfisburguer-36ifkh3a6-rodrigo-muinhos-projects.vercel.app`, promovido para
`menfisburguer.vercel.app`.

A página inicial passou a selecionar o modo kiosk no servidor quando recebe
`?kiosk=1` ou `?desktop=1`, preservando a URL usada pelo aplicativo desktop.
O pacote da Vercel exclui aplicativos desktop, ferramentas e arquivos locais
de ambiente; a primeira tentativa falhou por incluir um arquivo acima de 100 MB.

Teste real de navegador aprovado em produção: delivery com QR Code no atalho
do logo, kiosk com retirada, ambos sem erros JavaScript e sem imagens do evento.
Não foram criados pedidos nem cobranças neste teste.

Os 54 testes do backend passaram. A publicação do backend e a aplicação de V99
continuam pendentes: Railway CLI retornou Unauthorized e requer novo login.

A release preserva as correções remotas do Pix e dos comprovantes. A V99 compensa os aumentos de R$ 5 das migrações V94 e V95, incluindo doces e batatas. A numeração V95 inicialmente proposta foi corrigida após consultar origin/main; nenhuma migração aplicada foi editada.
