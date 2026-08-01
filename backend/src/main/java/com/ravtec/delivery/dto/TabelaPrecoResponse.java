package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TabelaPrecoResponse(
    UUID configuracaoId,
    String nome,
    LocalDate vigenteDesde,
    BigDecimal taxaRetorno,
    BigDecimal taxaEsperaTrintaMinutos,
    BigDecimal taxaInicialFallback,
    BigDecimal valorPorKmFallback,
    BigDecimal valorMinimoFallback,
    List<AreaPrecoResponse> areas,
    Long versao
) {
}
