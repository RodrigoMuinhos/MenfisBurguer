package com.menfis.delivery.config;

import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {
  @Bean
  FlywayConfigurationCustomizer flywayConfigurationCustomizer() {
    return (FluentConfiguration configuration) -> configuration.validateOnMigrate(false);
  }
}
