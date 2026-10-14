package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FormaPagamento;
import jakarta.validation.constraints.NotNull;

public record FormaPagamentoOperacionalRequest(@NotNull FormaPagamento formaPagamento) {}
