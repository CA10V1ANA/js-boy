package com.ravtec.delivery.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record DesignarEntregadorRequest(
    @NotNull UUID entregadorId
) {
}
