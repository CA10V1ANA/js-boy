package com.ravtec.delivery.dto;

import java.math.BigDecimal;

public record DashboardResumoResponse(
    long totalEntregas,
    long solicitadas,
    long emAndamento,
    long entregues,
    long canceladas,
    BigDecimal valorTotal,
    long clientes,
    long entregadoresAtivos
) {
}
