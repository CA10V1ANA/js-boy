package com.ravtec.delivery.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record AreaPrecoAtualizacaoRequest(
    @NotNull UUID id,
    @DecimalMin("0.00") BigDecimal valorMoto,
    @DecimalMin("0.00") BigDecimal valorCarro,
    Long versao
) {
}
