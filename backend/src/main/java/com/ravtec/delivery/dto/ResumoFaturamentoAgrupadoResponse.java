package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ResumoFaturamentoAgrupadoResponse(
    UUID id,
    String nome,
    long entregas,
    BigDecimal valorFaturado
) {
}
