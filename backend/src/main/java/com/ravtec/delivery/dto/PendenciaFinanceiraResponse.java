package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PendenciaFinanceiraResponse(
    UUID entregaId,
    String entregaCodigo,
    String clienteNome,
    BigDecimal valorEntrega,
    BigDecimal valorPago,
    BigDecimal valorPendente
) {
}
