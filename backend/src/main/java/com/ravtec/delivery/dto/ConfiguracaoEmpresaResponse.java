package com.ravtec.delivery.dto;

import java.util.UUID;

public record ConfiguracaoEmpresaResponse(
    UUID id,
    String nomeFantasia,
    String telefone,
    String whatsapp,
    String email,
    String cep,
    String logradouro,
    String numero,
    String complemento,
    String bairro,
    String cidade,
    String estado,
    String horarioAtendimento,
    Long versao
) {
}
