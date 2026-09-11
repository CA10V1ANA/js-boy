package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.NotificacaoOutbox;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.notifications.provider", havingValue = "resend")
public class NotificacaoResendProvider implements NotificacaoProvider {
    private final ResendEmailClient email;
    public NotificacaoResendProvider(ResendEmailClient email) { this.email = email; }
    @Override public void enviar(NotificacaoOutbox item) {
        String destino = item.getCliente() == null ? null : item.getCliente().getEmail();
        if (destino == null || destino.isBlank()) throw new IllegalStateException("Cliente sem e-mail para notificação");
        email.enviar(destino, "Atualização da entrega - JS Boy",
            "Há uma atualização na sua entrega. Evento: " + item.getEvento() + ". Acesse o portal da JS Boy para consultar.",
            item.getChaveIdempotencia());
    }
}
