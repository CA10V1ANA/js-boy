package com.ravtec.delivery.dto;

import java.math.BigDecimal;

public record ResumoEntregadorResponse(
    long entregasAtivas,
    long emRota,
    long concluidasHoje,
    BigDecimal valorMovimentadoHoje,
    long documentacaoPendente
) {
}
