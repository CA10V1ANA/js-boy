package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FormaPagamento;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PagamentoRequest(
    @NotNull UUID entregaId,
    @NotNull @DecimalMin("0.01") BigDecimal valor,
    @NotNull FormaPagamento formaPagamento,
    OffsetDateTime pagoEm,
    String comprovante,
    String observacoes
) {
}
