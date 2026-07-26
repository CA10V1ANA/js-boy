package com.ravtec.delivery.dto;

public record PreferenciaNotificacaoResponse(
    boolean emailAtivo, boolean whatsappAtivo, boolean smsAtivo
) {}
