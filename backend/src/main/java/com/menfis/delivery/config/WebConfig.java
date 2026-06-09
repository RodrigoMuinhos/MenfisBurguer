package com.menfis.delivery.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Value("${menfis.frontend-url}")
  private String frontendUrl;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      .allowedOriginPatterns(
        frontendUrl,
        "https://menfisburguer.com.br",
        "https://www.menfisburguer.com.br",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.*.*:3000",
        "http://10.*.*.*:3000",
        "http://172.16.*.*:3000",
        "http://172.17.*.*:3000",
        "http://172.18.*.*:3000",
        "http://172.19.*.*:3000",
        "http://172.2*.*.*:3000",
        "http://172.30.*.*:3000",
        "http://172.31.*.*:3000"
      )
      .allowedMethods("GET", "POST", "PATCH", "OPTIONS")
      .allowedHeaders("*");
  }
}
