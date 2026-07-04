package com.menfis.delivery.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
  @Bean
  OpenAPI menfisOpenApi() {
    return new OpenAPI()
      .info(new Info()
        .title("Menfi's Burger Delivery API")
        .version("0.1.0")
        .description("Pedidos, clientes, pagamentos, KDS, estoque, cupons e webhooks do Menfi's Burger.")
        .license(new License().name("Private")));
  }
}
