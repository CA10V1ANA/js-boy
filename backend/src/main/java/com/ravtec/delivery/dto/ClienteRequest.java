package com.ravtec.delivery.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
    @NotBlank @Size(max = 140) String nome,
    @NotBlank @Size(max = 30) String telefone,
    @Size(max = 30) String whatsapp,
    @Email @Size(max = 180) String email,
    @Size(max = 20) String documento,
    @NotBlank @Size(max = 180) String endereco,
    @NotBlank @Size(max = 80) String bairro,
    @NotBlank @Size(max = 80) String cidade,
    @Size(max = 500) String observacoes
) {
}

