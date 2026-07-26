package com.ravtec.delivery.dto;
import com.ravtec.delivery.entity.TipoLancamentoRazao;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
public record LancamentoRazaoResponse(
    UUID id, TipoLancamentoRazao tipo, String descricao, BigDecimal valor,
    OffsetDateTime ocorridoEm, LocalDate competencia, UUID clienteId,
    UUID entregadorId, UUID entregaId, UUID lancamentoOriginalId, String observacao
) {}
