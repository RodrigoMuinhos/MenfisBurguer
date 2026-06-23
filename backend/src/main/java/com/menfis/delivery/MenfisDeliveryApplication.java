package com.menfis.delivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MenfisDeliveryApplication {
  public static void main(String[] args) {
    SpringApplication.run(MenfisDeliveryApplication.class, args);
  }
}
