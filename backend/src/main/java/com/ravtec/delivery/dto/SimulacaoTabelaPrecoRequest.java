package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoVeiculo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record SimulacaoTabelaPrecoRequest(
    @NotBlank String bairroDestino,
    TipoVeiculo tipoVeiculo,
    @Min(0) Integer tempoEsperaMinutos,
    Boolean possuiRetorno,
    @DecimalMin("0.00") BigDecimal valorNegociado,
    @DecimalMin("0.00") BigDecimal distanciaKm
) {
}
