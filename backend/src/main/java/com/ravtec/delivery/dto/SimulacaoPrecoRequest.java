package com.ravtec.delivery.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SimulacaoPrecoRequest(
    @NotNull @DecimalMin("0.00") BigDecimal distanciaKm
) {
}
