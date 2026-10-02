package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.*;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class NotificacaoWorkerTest {
    private final NotificacaoOutboxRepository repository = mock(NotificacaoOutboxRepository.class);
    private final PreferenciaNotificacaoRepository preferencias = mock(PreferenciaNotificacaoRepository.class);
    private final NotificacaoProvider provider = mock(NotificacaoProvider.class);
    private final NotificacaoWorker worker = new NotificacaoWorker(repository, preferencias, provider);

    private NotificacaoOutbox pendente() {
        var cliente = new Cliente(); cliente.setId(UUID.randomUUID()); cliente.setAtivo(true);
        var item = new NotificacaoOutbox(); item.setCliente(cliente); item.setStatus(StatusNotificacao.PENDENTE);
        when(repository.reservarProxima(any())).thenReturn(Optional.of(item));
        return item;
    }

    @Test void respeitaEmailDesativado() {
        var item = pendente();
        var preferencia = new PreferenciaNotificacao(); preferencia.setEmailAtivo(false);
        when(preferencias.findByClienteId(item.getCliente().getId())).thenReturn(Optional.of(preferencia));
        assertThat(worker.processarUma()).isTrue();
        assertThat(item.getStatus()).isEqualTo(StatusNotificacao.DESATIVADA);
        verifyNoInteractions(provider);
    }

    @Test void confirmaEnvioReservado() {
        var item = pendente();
        assertThat(worker.processarUma()).isTrue();
        assertThat(item.getStatus()).isEqualTo(StatusNotificacao.ENVIADA);
        assertThat(item.getProcessadaEm()).isNotNull();
        assertThat(item.getTentativas()).isEqualTo(1);
        verify(provider).enviar(item);
    }

    @Test void limitaFalhasSemVazarRespostaDoProvedor() {
        var item = pendente(); item.setTentativas(4);
        doThrow(new IllegalStateException("segredo do provedor")).when(provider).enviar(item);
        worker.processarUma();
        assertThat(item.getStatus()).isEqualTo(StatusNotificacao.FALHOU);
        assertThat(item.getUltimoErro()).doesNotContain("segredo");
    }

    @Test void paraQuandoNaoHaItemReservavel() {
        assertThat(worker.processarUma()).isFalse();
        verifyNoInteractions(provider);
    }
}
