package com.ravtec.delivery.dto;

import java.math.BigDecimal;

public record SimulacaoPrecoResponse(
    BigDecimal distanciaKm,
    BigDecimal taxaInicial,
    BigDecimal valorPorKm,
    BigDecimal valorMinimo,
    BigDecimal valorCalculado
) {
}
