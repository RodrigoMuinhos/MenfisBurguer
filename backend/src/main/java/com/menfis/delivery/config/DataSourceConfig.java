package com.menfis.delivery.config;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceConfig {
  @Bean
  DataSource dataSource() {
    String raw = firstNonBlank(
      System.getenv("JDBC_DATABASE_URL"),
      System.getenv("DATABASE_URL"),
      "jdbc:postgresql://localhost:5432/menfis"
    );

    HikariDataSource ds = new HikariDataSource();
    ds.setJdbcUrl(toJdbcUrl(raw));
    ds.setMaximumPoolSize(5);
    ds.setMinimumIdle(1);
    return ds;
  }

  private static String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) return value.trim().replace("\"", "");
    }
    throw new IllegalStateException("DATABASE_URL is required");
  }

  private static String toJdbcUrl(String raw) {
    if (raw.startsWith("jdbc:postgresql://")) return raw;
    if (raw.startsWith("postgresql://") || raw.startsWith("postgres://")) {
      URI uri = URI.create(raw.replace("postgres://", "postgresql://"));
      String[] userInfo = uri.getUserInfo() == null ? new String[0] : uri.getUserInfo().split(":", 2);
      String query = uri.getRawQuery() == null ? "" : "&" + uri.getRawQuery();
      String user = userInfo.length > 0 ? "user=" + decode(userInfo[0]) : "";
      String password = userInfo.length > 1 ? "&password=" + decode(userInfo[1]) : "";
      return "jdbc:postgresql://" + uri.getHost() + ":" + port(uri) + uri.getPath() + "?" + user + password + query;
    }
    throw new IllegalArgumentException("Unsupported DATABASE_URL format");
  }

  private static int port(URI uri) {
    return uri.getPort() > 0 ? uri.getPort() : 5432;
  }

  private static String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }
}
