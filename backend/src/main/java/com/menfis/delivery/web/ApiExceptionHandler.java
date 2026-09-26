package com.menfis.delivery.web;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(EmptyResultDataAccessException.class)
  ResponseEntity<Map<String, Object>> notFound() {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "not_found"));
  }

  @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
  ResponseEntity<Map<String, Object>> badRequest(Exception error) {
    return ResponseEntity.badRequest().body(Map.of("error", message(error, "bad_request")));
  }

  @ExceptionHandler(IllegalStateException.class)
  ResponseEntity<Map<String, Object>> state(IllegalStateException error) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", message(error, "conflict")));
  }

  // Sem estes handlers o Spring encaminha o erro para /error, que a segurança
  // bloqueia para anônimos: o totem recebia um 403 vazio e o motivo se perdia.
  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<Map<String, Object>> status(ResponseStatusException error) {
    String reason = error.getReason() == null ? "error" : error.getReason();
    return ResponseEntity.status(error.getStatusCode()).body(Map.of("error", reason));
  }

  @ExceptionHandler(RuntimeException.class)
  ResponseEntity<Map<String, Object>> unexpected(RuntimeException error) {
    if (error instanceof ErrorResponse response) {
      return ResponseEntity.status(response.getStatusCode())
        .body(Map.of("error", message(error, "error")));
    }
    log.error("UNHANDLED_API_ERROR", error);
    String detail = error.getClass().getSimpleName() + ": " + message(error, "sem detalhes");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
      .body(Map.of("error", "internal_error: " + detail.substring(0, Math.min(200, detail.length()))));
  }

  private static String message(Exception error, String fallback) {
    String message = error.getMessage();
    return message == null || message.isBlank() ? fallback : message;
  }
}
