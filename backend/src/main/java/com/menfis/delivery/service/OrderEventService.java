package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class OrderEventService {
  private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

  public SseEmitter subscribe(String orderId, OrderResponse current) {
    SseEmitter emitter = new SseEmitter(0L);
    emitters.computeIfAbsent(orderId, id -> new CopyOnWriteArrayList<>()).add(emitter);
    emitter.onCompletion(() -> remove(orderId, emitter));
    emitter.onTimeout(() -> remove(orderId, emitter));
    emitter.onError(error -> remove(orderId, emitter));
    send(emitter, current);
    return emitter;
  }

  public void publish(String orderId, OrderResponse order) {
    List<SseEmitter> orderEmitters = emitters.get(orderId);
    if (orderEmitters == null || orderEmitters.isEmpty()) return;

    for (SseEmitter emitter : orderEmitters) {
      send(emitter, order);
    }
  }

  private void send(SseEmitter emitter, OrderResponse order) {
    try {
      emitter.send(SseEmitter.event().name("order.updated").data(order));
    } catch (IOException | IllegalStateException e) {
      emitter.completeWithError(e);
    }
  }

  private void remove(String orderId, SseEmitter emitter) {
    List<SseEmitter> orderEmitters = emitters.get(orderId);
    if (orderEmitters == null) return;
    orderEmitters.remove(emitter);
    if (orderEmitters.isEmpty()) {
      emitters.remove(orderId);
    }
  }
}
