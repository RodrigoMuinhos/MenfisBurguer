# Reativação e reajuste do cardápio

07/10/2026: reativar Menfi's Salad e Nuggets de 90g, 180g e 270g, e
aumentar todos os preços de produtos do cardápio em R$ 4,00.

V100 reativa os quatro produtos em products e pricing_products e aumenta
sale_price e o preço correspondente em products uma vez pelo Flyway.
O preço de referência das promoções aumenta junto, preservando o desconto
em reais. Os IDs antigos nuggets-100g e nuggets-10un permanecem desativados,
pois foram substituídos pela migração V36. Ingredientes e adicionais não
fazem parte deste reajuste dos produtos do cardápio.

A categoria Salad fica visível no site móvel e desktop. Os preços do
catálogo local também recebem R$ 4,00, mantendo a coerência do fallback.

Antes do deploy foi salva uma cópia da API pública de preços em
C:/Users/RODRIGO/Desktop/menfis-prices-before-plus-four.json para comparar
todos os valores após a migração.
