package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import jakarta.validation.constraints.NotNull;

public record EntregaStatusRequest(
    @NotNull StatusEntrega status
) {
}
