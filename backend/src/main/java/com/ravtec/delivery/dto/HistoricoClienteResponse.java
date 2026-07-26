package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import java.time.OffsetDateTime;

public record HistoricoClienteResponse(
    StatusEntrega statusAnterior,
    StatusEntrega novoStatus,
    OffsetDateTime alteradoEm
) {
}
