package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoChavePix;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record PerfilEntregadorRequest(
    @Size(max = 140) String nome,
    @Email @Size(max = 180) String email,
    @Size(max = 30) String telefone,
    @Size(max = 12) String placaVeiculo,
    TipoChavePix tipoChavePix,
    @Size(max = 180) String chavePix,
    @Size(max = 140) String titularPix
) {}
