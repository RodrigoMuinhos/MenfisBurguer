# Menfis Delivery Backend

Backend Spring Boot que assume as decisões de negócio do delivery:

- recalcula preço, taxa, adicionais e combo;
- salva pedido no PostgreSQL/Neon;
- cria pagamento Mercado Pago;
- recebe webhook idempotente;
- alimenta KDS por FIFO usando `confirmed_at`;
- movimenta estoque quando o pedido entra em produção;
- entrega dados reais para dashboard.

## Local

```powershell
# Configure as variaveis sensiveis apenas no ambiente local ou no provedor.
# Nao versionar .env, tokens, connection strings, URLs internas ou segredos.
mvn spring-boot:run
```

## Endpoints

As rotas operacionais ficam documentadas internamente. Evite publicar mapa de endpoints sensiveis no repositorio publico.
