package com.ravtec.delivery.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ConfiguracaoPrecoRequest(
    @NotNull @DecimalMin("0.00") BigDecimal taxaInicial,
    @NotNull @DecimalMin("0.00") BigDecimal valorPorKm,
    @NotNull @DecimalMin("0.00") BigDecimal valorMinimo
) {
}
