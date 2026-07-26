package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FormaPagamento;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PagamentoRequest(
    @NotNull UUID entregaId,
    @NotNull @DecimalMin("0.01") BigDecimal valor,
    @NotNull FormaPagamento formaPagamento,
    OffsetDateTime pagoEm,
    @Size(max = 500) String comprovante,
    @Size(max = 500) String observacoes
) {
}
