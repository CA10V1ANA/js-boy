package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ItemExtratoMensalEntregadorResponse(
    UUID entregaId,
    String codigo,
    String clienteNome,
    OffsetDateTime concluidaEm,
    BigDecimal valorFaturado
) {
}
