package com.ravtec.delivery.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConfiguracaoEmpresaRequest(
    @NotBlank @Size(max = 140) String nomeFantasia,
    @Size(max = 30) String telefone,
    @Size(max = 30) String whatsapp,
    @Email @Size(max = 180) String email,
    @Size(max = 10) String cep,
    @Size(max = 180) String logradouro,
    @Size(max = 20) String numero,
    @Size(max = 120) String complemento,
    @Size(max = 80) String bairro,
    @Size(max = 80) String cidade,
    @Size(max = 2) String estado,
    @Size(max = 180) String horarioAtendimento
) {
}
