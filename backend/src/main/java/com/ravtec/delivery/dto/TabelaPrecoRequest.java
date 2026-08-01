package com.ravtec.delivery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record TabelaPrecoRequest(
    @NotNull @DecimalMin("0.00") BigDecimal taxaRetorno,
    @NotNull @DecimalMin("0.00") BigDecimal taxaEsperaTrintaMinutos,
    @NotNull @DecimalMin("0.00") BigDecimal taxaInicialFallback,
    @NotNull @DecimalMin("0.00") BigDecimal valorPorKmFallback,
    @NotNull @DecimalMin("0.00") BigDecimal valorMinimoFallback,
    @NotEmpty List<@Valid AreaPrecoAtualizacaoRequest> areas
) {
}
