package com.ravtec.delivery.dto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
public record RelatorioRazaoResponse(
    LocalDate inicio, LocalDate fim, BigDecimal faturado, BigDecimal recebido,
    BigDecimal pendente, BigDecimal estornado, BigDecimal despesas, BigDecimal taxas,
    BigDecimal repassesEntregadores, BigDecimal resultado,
    Map<String, Long> entregasPorCliente, Map<String, Long> entregasPorEntregador
) {}
