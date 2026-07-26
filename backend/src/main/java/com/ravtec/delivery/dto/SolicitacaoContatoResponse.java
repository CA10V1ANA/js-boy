package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusSolicitacaoContato;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SolicitacaoContatoResponse(
    UUID id,
    String protocolo,
    String nome,
    String empresa,
    String email,
    String telefone,
    String mensagem,
    StatusSolicitacaoContato status,
    OffsetDateTime criadoEm
) {
}
