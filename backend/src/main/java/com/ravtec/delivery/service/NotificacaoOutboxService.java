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
    private final NotificacaoProvider provider;

    @Transactional
    public void enfileirar(Entrega entrega, String evento, String chave) {
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
    @Transactional
    public void processarPendentes() {
        var agora = OffsetDateTime.now();
        for (var item : repository.findTop50ByStatusAndProximaTentativaEmLessThanEqualOrderByCriadoEm(
            StatusNotificacao.PENDENTE, agora
        )) {
            try {
                item.setStatus(StatusNotificacao.PROCESSANDO);
                item.setTentativas(item.getTentativas() + 1);
                provider.enviar(item);
                item.setStatus(StatusNotificacao.ENVIADA);
                item.setProcessadaEm(OffsetDateTime.now());
                item.setUltimoErro(null);
            } catch (RuntimeException exception) {
                item.setUltimoErro("Falha temporaria do provedor");
                if (item.getTentativas() >= 5) {
                    item.setStatus(StatusNotificacao.FALHOU);
                } else {
                    item.setStatus(StatusNotificacao.PENDENTE);
                    item.setProximaTentativaEm(agora.plusMinutes(item.getTentativas()));
                }
            }
        }
    }

    private String mascarar(String value) {
        if (value == null || value.isBlank()) return null;
        int at = value.indexOf('@');
        return at > 1 ? value.substring(0, 1) + "***" + value.substring(at) : "***";
    }
}
