package com.menfis.delivery.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  public SecurityConfig(@Value("${menfis.jwt-secret}") String jwtSecret) {
    this.jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtSecret);
  }

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
      .cors(Customizer.withDefaults())
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/settings/public").permitAll()
        .requestMatchers(HttpMethod.GET, "/orders/events", "/api/orders/events")
          .hasRole("ADMIN")
        .requestMatchers("/orders/delivery-route", "/orders/*/delivery-confirmation",
          "/api/orders/delivery-route", "/api/orders/*/delivery-confirmation")
          .hasAnyRole("DELIVERY", "ADMIN")
        .requestMatchers("/api/admin/dining/**").hasAnyRole("MANAGER", "ADMIN")
        .requestMatchers("/api/staff/dining/**").hasAnyRole("STAFF", "MANAGER", "ADMIN")
        .requestMatchers(
          "/dashboard/**",
          "/monitoring/**",
          "/api/monitoring/**",
          "/inventory/**",
          "/reports/**",
          "/api/reports/**",
          "/kds/**",
          "/kitchen/**",
          "/api/kitchen/**",
          "/settings/**",
          "/customers/crm",
          "/customers/admin/**"
        ).hasRole("ADMIN")
        .requestMatchers(HttpMethod.GET, "/orders", "/api/orders").hasRole("ADMIN")
        .requestMatchers(HttpMethod.PATCH, "/orders/**", "/api/orders/**").hasRole("ADMIN")
        .requestMatchers(HttpMethod.DELETE, "/orders/**", "/api/orders/**").hasRole("ADMIN")
        .requestMatchers(HttpMethod.GET,
          "/",
          "/actuator/health",
          "/actuator/info",
          "/settings/public",
          "/pricing",
          "/coupons/public",
          "/orders/kiosk-board",
          "/orders/*",
          "/orders/*/status",
          "/orders/*/events",
          "/api/orders/kiosk-board",
          "/api/orders/*",
          "/api/orders/*/status",
          "/api/orders/*/events",
          "/terminal-payments/availability",
          "/api/terminal-payments/availability",
          "/terminal-payments/*",
          "/api/terminal-payments/*"
        ).permitAll()
        .requestMatchers(HttpMethod.POST,
          "/auth/login",
          "/auth/kds",
          "/auth/admin",
          "/auth/delivery",
          "/auth/admin/logout",
          "/customers/session",
          "/customers/login",
          "/customers/sold-out-alert",
          "/customers/password/recovery",
          "/customers/password/reset",
          "/orders",
          "/api/orders",
          "/orders/*/payment-proof",
          "/api/orders/*/payment-proof",
          "/payments/pix",
          "/payments/checkout",
          "/payments/webhook/mercadopago",
          "/support/tickets",
          "/terminal-payments",
          "/api/terminal-payments",
          "/terminal-payments/customer-name",
          "/api/terminal-payments/customer-name",
          "/terminal-payments/*/cancel",
          "/api/terminal-payments/*/cancel"
        ).permitAll()
        .requestMatchers(HttpMethod.GET, "/api/whatsapp/webhook", "/whatsapp/webhook").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/whatsapp/webhook", "/whatsapp/webhook").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/webhooks/whatsapp", "/webhooks/whatsapp").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/webhooks/whatsapp", "/webhooks/whatsapp").permitAll()
        .requestMatchers("/customers/me", "/customers/orders").hasRole("CUSTOMER")
        .anyRequest().authenticated())
      .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
      .build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
