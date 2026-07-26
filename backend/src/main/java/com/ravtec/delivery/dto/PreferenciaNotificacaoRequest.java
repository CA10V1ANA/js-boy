package com.ravtec.delivery.dto;

public record PreferenciaNotificacaoRequest(
    boolean emailAtivo, boolean whatsappAtivo, boolean smsAtivo
) {}
