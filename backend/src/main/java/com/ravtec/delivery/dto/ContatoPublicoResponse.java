package com.ravtec.delivery.dto;

import java.time.OffsetDateTime;

public record ContatoPublicoResponse(
    String protocolo,
    OffsetDateTime recebidoEm,
    String mensagem
) {
}
