package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoVeiculo;
import java.time.OffsetDateTime;
import java.util.UUID;

public record EntregadorResponse(
    UUID id,
    String nome,
    String cpf,
    String telefone,
    String email,
    TipoVeiculo tipoVeiculo,
    String placaVeiculo,
    boolean ativo,
    boolean disponivel,
    boolean possuiAcesso,
    OffsetDateTime criadoEm
) {
}
