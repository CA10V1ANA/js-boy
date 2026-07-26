package com.ravtec.delivery.service;

import static org.mockito.Mockito.*;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.repository.NotificacaoOutboxRepository;
import org.junit.jupiter.api.Test;

class NotificacaoOutboxServiceTest {
    @Test
    void naoDuplicaEventoComMesmaChave() {
        var repository = mock(NotificacaoOutboxRepository.class);
        var provider = mock(NotificacaoProvider.class);
        when(repository.existsByChaveIdempotencia("entrega:1:coleta")).thenReturn(true);
        var service = new NotificacaoOutboxService(repository, provider);

        service.enfileirar(new Entrega(), "COLETA_REALIZADA", "entrega:1:coleta");

        verify(repository, never()).save(any());
    }
}
