package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.NotificacaoOutbox;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.notifications.provider", havingValue = "local", matchIfMissing = true)
public class NotificacaoLocalProvider implements NotificacaoProvider {
    @Override
    public void enviar(NotificacaoOutbox notificacao) {
        log.info("notification_event={} channel={} id={} destination={}",
            notificacao.getEvento(), notificacao.getCanal(), notificacao.getId(),
            notificacao.getDestinoMascarado());
    }
}
