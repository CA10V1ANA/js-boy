package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoOcorrencia;
import java.time.OffsetDateTime;
import java.util.UUID;

public record OcorrenciaResponse(
    UUID id, UUID paradaId, TipoOcorrencia tipo, String motivo,
    String observacao, String proximaAcao, OffsetDateTime ocorridaEm
) {}
