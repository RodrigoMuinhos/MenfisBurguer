package com.menfis.delivery.config;

import com.menfis.delivery.web.AuthController;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final SecretKey signingKey;

  public JwtAuthenticationFilter(String jwtSecret) {
    this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    String token = bearerToken(request);
    if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      try {
        Claims claims = Jwts.parser().verifyWith(signingKey).build()
          .parseSignedClaims(token)
          .getPayload();
        String role = claims.get("role", String.class);
        if (claims.getSubject() != null && role != null && !role.isBlank()) {
          var authentication = new UsernamePasswordAuthenticationToken(
            claims.getSubject(),
            null,
            List.of(new SimpleGrantedAuthority("ROLE_" + role))
          );
          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      } catch (RuntimeException ignored) {
        SecurityContextHolder.clearContext();
      }
    }
    filterChain.doFilter(request, response);
  }

  private String bearerToken(HttpServletRequest request) {
    String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (authorization != null && authorization.startsWith("Bearer ")) {
      String token = authorization.substring(7).trim();
      return token.isEmpty() ? null : token;
    }
    Cookie[] cookies = request.getCookies();
    if (cookies == null) return null;
    for (Cookie cookie : cookies) {
      if (AuthController.ADMIN_SESSION_COOKIE.equals(cookie.getName())
          && !cookie.getValue().isBlank()) {
        return cookie.getValue();
      }
    }
    return null;
  }
}
