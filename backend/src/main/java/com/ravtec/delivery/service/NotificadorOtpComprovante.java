package com.ravtec.delivery.service;

import java.util.UUID;

public interface NotificadorOtpComprovante {
    void enviar(String destino, String codigo, UUID entregaId);
}
