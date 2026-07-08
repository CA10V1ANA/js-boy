package com.ravtec.delivery.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FuncionarioResponse(
    UUID id,
    String nome,
    String email,
    boolean ativo,
    OffsetDateTime criadoEm
) {
}
