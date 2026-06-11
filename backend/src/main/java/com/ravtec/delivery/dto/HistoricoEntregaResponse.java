package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import java.time.OffsetDateTime;

public record HistoricoEntregaResponse(
    StatusEntrega statusAnterior,
    StatusEntrega novoStatus,
    String usuarioResponsavelNome,
    OffsetDateTime alteradoEm
) {
}
