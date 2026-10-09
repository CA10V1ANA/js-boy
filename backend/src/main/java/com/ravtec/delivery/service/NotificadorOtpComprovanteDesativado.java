package com.ravtec.delivery.service;

import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Keeps historical proof services readable without requiring an active OTP provider. */
@Component
@ConditionalOnProperty(name = "app.proof.otp.provider", havingValue = "disabled")
public class NotificadorOtpComprovanteDesativado implements NotificadorOtpComprovante {
    @Override
    public void enviar(String destino, String codigo, UUID entregaId) {
        throw new IllegalStateException("O fluxo de comprovante com OTP foi descontinuado");
    }
}
