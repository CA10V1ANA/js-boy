package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ExtratoMensalEntregadorResponse(
    LocalDate inicio,
    LocalDate fim,
    long entregasConcluidas,
    BigDecimal valorFaturado,
    List<ItemExtratoMensalEntregadorResponse> itens
) {
}
