package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusSolicitacaoContato;
import jakarta.validation.constraints.NotNull;

public record SolicitacaoContatoStatusRequest(
    @NotNull StatusSolicitacaoContato status
) {
}
