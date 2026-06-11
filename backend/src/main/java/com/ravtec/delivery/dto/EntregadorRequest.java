package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoVeiculo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EntregadorRequest(
    @NotBlank @Size(max = 140) String nome,
    @NotBlank @Size(max = 20) String cpf,
    @NotBlank @Size(max = 30) String telefone,
    @Email @Size(max = 180) String email,
    @NotNull TipoVeiculo tipoVeiculo,
    @Size(max = 12) String placaVeiculo,
    boolean disponivel
) {
}

