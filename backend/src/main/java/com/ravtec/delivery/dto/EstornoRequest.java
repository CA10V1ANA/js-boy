package com.ravtec.delivery.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record EstornoRequest(
    @NotNull @DecimalMin("0.01") BigDecimal valor,
    @NotBlank @Size(max = 500) String motivo
) {
}
