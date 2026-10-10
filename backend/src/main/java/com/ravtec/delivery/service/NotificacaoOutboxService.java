package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.NotificacaoOutboxRepository;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificacaoOutboxService {

    private final NotificacaoOutboxRepository repository;
    private final NotificacaoWorker worker;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private NotificacaoInternaService internas;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ConversaService conversas;

    @Transactional
    public void eventoInterno(Entrega entrega, String evento, String chave) {
        if (internas != null) internas.evento(entrega, evento, chave, null);
        if (conversas != null) conversas.evento(entrega, evento, chave);
    }

    @Transactional
    public void enfileirar(Entrega entrega, String evento, String chave) {
        eventoInterno(entrega, evento, chave);
        if (repository.existsByChaveIdempotencia(chave)) {
            return;
        }
        var item = new NotificacaoOutbox();
        item.setCliente(entrega.getCliente());
        item.setEntrega(entrega);
        item.setEvento(evento);
        item.setCanal(CanalNotificacao.EMAIL);
        item.setDestinoMascarado(mascarar(entrega.getCliente().getEmail()));
        item.setPayloadMinimo("{\"codigo\":\"" + entrega.getCodigo() + "\",\"evento\":\"" + evento + "\"}");
        item.setChaveIdempotencia(chave);
        item.setStatus(StatusNotificacao.PENDENTE);
        item.setProximaTentativaEm(OffsetDateTime.now());
        repository.save(item);
    }

    @Scheduled(fixedDelayString = "${app.notifications.poll-ms:30000}")
    public void processarPendentes() {
        for (int i = 0; i < 50 && worker.processarUma(); i++) {
            /* bounded batch */
        }
    }

    private String mascarar(String value) {
        if (value == null || value.isBlank()) return null;
        int at = value.indexOf('@');
        return at > 1 ? value.substring(0, 1) + "***" + value.substring(at) : "***";
    }
}
