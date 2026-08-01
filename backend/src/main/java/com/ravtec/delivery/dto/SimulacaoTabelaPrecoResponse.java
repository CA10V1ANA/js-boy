package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.OrigemPreco;
import com.ravtec.delivery.entity.TipoVeiculo;
import java.math.BigDecimal;

public record SimulacaoTabelaPrecoResponse(
    String bairroDestino,
    String areaCodigo,
    String areaNome,
    TipoVeiculo tipoVeiculo,
    OrigemPreco origemPreco,
    BigDecimal tarifaBase,
    BigDecimal taxaRetorno,
    BigDecimal taxaEspera,
    Integer blocosEspera,
    BigDecimal valorCalculado,
    boolean valorNegociadoObrigatorio,
    String mensagem
) {
}
