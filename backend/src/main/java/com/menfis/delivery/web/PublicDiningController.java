package com.menfis.delivery.web;

import com.menfis.delivery.dto.DiningDtos.DiningCustomerNameRequest;
import com.menfis.delivery.dto.DiningDtos.PublicDiningSessionResponse;
import com.menfis.delivery.service.DiningService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/dining/kits")
public class PublicDiningController {
  private final DiningService dining;

  public PublicDiningController(DiningService dining) {
    this.dining = dining;
  }

  @GetMapping("/{token}/session")
  public PublicDiningSessionResponse session(@PathVariable String token) {
    return dining.resolvePublicSession(token);
  }

  @PostMapping("/{token}/session/customer-name")
  public PublicDiningSessionResponse identify(
      @PathVariable String token,
      @Valid @RequestBody DiningCustomerNameRequest request) {
    return dining.identifyCustomer(token, request.name());
  }
}
