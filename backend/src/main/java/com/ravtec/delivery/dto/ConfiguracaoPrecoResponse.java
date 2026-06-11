package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ConfiguracaoPrecoResponse(
    UUID id,
    BigDecimal taxaInicial,
    BigDecimal valorPorKm,
    BigDecimal valorMinimo
) {
}
