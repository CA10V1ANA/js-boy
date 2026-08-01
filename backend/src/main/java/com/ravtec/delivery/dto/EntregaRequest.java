package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoVeiculo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
    String observacaoValorManual,
    TipoVeiculo tipoVeiculo,
    @Min(0) Integer tempoEsperaMinutos,
    Boolean possuiRetorno,
    @DecimalMin("0.00") BigDecimal valorNegociado
) {
    public EntregaRequest(
        UUID clienteId, UUID entregadorId, String enderecoOrigem, String bairroOrigem,
        String enderecoDestino, String bairroDestino, String destinatarioNome,
        String destinatarioTelefone, String descricaoMercadoria, String observacoes,
        BigDecimal distanciaKm, BigDecimal valorFinal, String observacaoValorManual
    ) {
        this(clienteId, entregadorId, enderecoOrigem, bairroOrigem, enderecoDestino, bairroDestino,
            destinatarioNome, destinatarioTelefone, descricaoMercadoria, observacoes, distanciaKm,
            valorFinal, observacaoValorManual, TipoVeiculo.MOTO, 0, false, null);
    }
}
