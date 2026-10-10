package com.ravtec.delivery.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public final class EnderecoClienteDto {

    private EnderecoClienteDto() {}

    public record Dados(
        @NotBlank @Size(max = 80) String apelido,
        @NotBlank @Size(max = 180) String endereco,
        @NotBlank @Size(max = 80) String bairro,
        @NotBlank @Size(max = 80) String cidade,
        @NotBlank @Pattern(regexp = "[A-Za-z]{2}") String estado,
        @Pattern(regexp = "[0-9]{8}|^$") String cep,
        @Size(max = 120) String complemento,
        @Size(max = 500) String referencia,
        @Size(max = 140) String contatoNome,
        @Size(max = 30) String contatoTelefone
    ) {}

    public record Registro(
        UUID id,
        String apelido,
        String endereco,
        String bairro,
        String cidade,
        String estado,
        String cep,
        String complemento,
        String referencia,
        String contatoNome,
        String contatoTelefone,
        long versao
    ) {}
}
