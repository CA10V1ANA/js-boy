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
    @Size(max = 500) String observacoes,
    @Size(max = 10) String cep,
    @Size(max = 180) String logradouro,
    @Size(max = 20) String numero,
    @Size(max = 120) String complemento,
    @Size(max = 2) String estado,
    boolean semNumero
) {
    public ClienteRequest(
        String nome, String telefone, String whatsapp, String email, String documento,
        String endereco, String bairro, String cidade, String observacoes
    ) {
        this(nome, telefone, whatsapp, email, documento, endereco, bairro, cidade, observacoes,
            null, endereco, "S/N", null, null, true);
    }
}
