package com.menfis.delivery.service;

import com.menfis.delivery.domain.TableLightState;
import java.util.UUID;

public interface TableLightGateway {
  void setState(UUID kitId, TableLightState state);
}
