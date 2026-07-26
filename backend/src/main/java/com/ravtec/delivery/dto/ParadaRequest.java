package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoParada;
import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public record ParadaRequest(
    @NotNull @Min(1) Integer ordem,
    @NotNull TipoParada tipo,
    @NotBlank String logradouro,
    String numero,
    boolean semNumero,
    String complemento,
    @NotBlank String bairro,
    String cidade,
    @Pattern(regexp = "^[A-Za-z]{2}$") String estado,
    @Pattern(regexp = "^\\d{8}$") String cep,
    String contatoNome,
    String contatoTelefone,
    String observacao,
    OffsetDateTime previstaEm
) {}
