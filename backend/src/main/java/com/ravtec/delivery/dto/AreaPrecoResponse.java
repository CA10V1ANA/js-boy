package com.ravtec.delivery.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AreaPrecoResponse(
    UUID id,
    String codigo,
    String nome,
    Integer ordem,
    BigDecimal valorMoto,
    BigDecimal valorCarro,
    boolean valorNegociado,
    List<String> bairros,
    Long versao
) {
}
