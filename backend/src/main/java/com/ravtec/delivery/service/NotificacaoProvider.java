package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.NotificacaoOutbox;

public interface NotificacaoProvider {
    void enviar(NotificacaoOutbox notificacao);
}
