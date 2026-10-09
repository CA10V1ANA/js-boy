package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FormaPagamento;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ConfirmarRecebimentoRequest(
    @NotNull @DecimalMin("0.01") BigDecimal valor,
    @NotNull FormaPagamento formaPagamento,
    @NotBlank @Size(max = 64) String referenciaRecebedor
) {}
