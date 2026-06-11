package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FormaPagamento;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PagamentoResponse(
    UUID id,
    UUID entregaId,
    String entregaCodigo,
    String clienteNome,
    BigDecimal valor,
    FormaPagamento formaPagamento,
    OffsetDateTime pagoEm,
    String comprovante,
    String observacoes,
    OffsetDateTime criadoEm
) {
}
