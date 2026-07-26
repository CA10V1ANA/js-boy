package com.ravtec.delivery.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LinkRastreamentoResponse(
    UUID id, String codigoPublico, String token, OffsetDateTime expiraEm,
    OffsetDateTime revogadoEm, long acessos
) {}
