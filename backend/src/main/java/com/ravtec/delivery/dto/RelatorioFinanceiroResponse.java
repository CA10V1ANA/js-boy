package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioFinanceiroResponse(
    BigDecimal valorEntregas,
    BigDecimal valorRecebido,
    BigDecimal valorPendente,
    long pagamentosRegistrados,
    List<PendenciaFinanceiraResponse> pendencias
) {
}
