package com.ravtec.delivery.service;

import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile({"local", "test"})
@ConditionalOnProperty(
    name = "app.proof.otp.provider",
    havingValue = "local",
    matchIfMissing = true
)
public class NotificadorOtpComprovanteLocal implements NotificadorOtpComprovante {
    @Override
    public void enviar(String destino, String codigo, UUID entregaId) {
        log.info("proof_otp_event=local_delivery delivery_id={} destination={} code={}",
            entregaId, mascarar(destino), codigo);
    }

    private String mascarar(String destino) {
        if (destino == null || destino.length() < 4) return "***";
        return "***" + destino.substring(destino.length() - 4);
    }
}
