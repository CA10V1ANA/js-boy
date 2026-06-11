package com.ravtec.delivery.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ClienteResponse(
    UUID id,
    String nome,
    String telefone,
    String whatsapp,
    String email,
    String documento,
    String endereco,
    String bairro,
    String cidade,
    String observacoes,
    boolean ativo,
    OffsetDateTime criadoEm
) {
}

