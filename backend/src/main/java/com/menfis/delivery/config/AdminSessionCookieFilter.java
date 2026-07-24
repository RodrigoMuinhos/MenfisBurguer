package com.menfis.delivery.config;

import com.menfis.delivery.web.AuthController;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AdminSessionCookieFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    String existingAuthorization = request.getHeader(HttpHeaders.AUTHORIZATION);
    String adminToken = readCookie(request, AuthController.ADMIN_SESSION_COOKIE);

    if (existingAuthorization != null || adminToken == null || adminToken.isBlank()) {
      filterChain.doFilter(request, response);
      return;
    }

    HttpServletRequestWrapper cookieAuthenticatedRequest = new HttpServletRequestWrapper(request) {
      @Override
      public String getHeader(String name) {
        if (HttpHeaders.AUTHORIZATION.equalsIgnoreCase(name)) {
          return "Bearer " + adminToken;
        }
        return super.getHeader(name);
      }
    };
    filterChain.doFilter(cookieAuthenticatedRequest, response);
  }

  private String readCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) return null;
    for (Cookie cookie : cookies) {
      if (name.equals(cookie.getName())) return cookie.getValue();
    }
    return null;
  }
}
