package com.ravtec.delivery.dto;
import com.ravtec.delivery.entity.TipoLancamentoRazao;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
public record LancamentoRazaoRequest(
    @NotNull TipoLancamentoRazao tipo, @NotBlank String descricao,
    @NotNull @DecimalMin("0.01") BigDecimal valor, @NotNull LocalDate competencia,
    OffsetDateTime ocorridoEm, UUID clienteId, UUID entregadorId, UUID entregaId,
    UUID lancamentoOriginalId, String observacao
) {}
