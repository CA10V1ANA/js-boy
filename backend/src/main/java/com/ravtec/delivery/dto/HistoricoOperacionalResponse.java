package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import java.time.OffsetDateTime;

public record HistoricoOperacionalResponse(
    StatusEntrega statusAnterior,
    StatusEntrega novoStatus,
    OffsetDateTime alteradoEm
) {
}
