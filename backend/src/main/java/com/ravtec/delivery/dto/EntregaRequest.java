package com.ravtec.delivery.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record EntregaRequest(
    @NotNull UUID clienteId,
    UUID entregadorId,
    @NotBlank String enderecoOrigem,
    @NotBlank String bairroOrigem,
    @NotBlank String enderecoDestino,
    @NotBlank String bairroDestino,
    @NotBlank String destinatarioNome,
    @NotBlank String destinatarioTelefone,
    @NotBlank String descricaoMercadoria,
    String observacoes,
    @NotNull @DecimalMin("0.00") BigDecimal distanciaKm,
    @DecimalMin("0.00") BigDecimal valorFinal,
    String observacaoValorManual
) {
}
