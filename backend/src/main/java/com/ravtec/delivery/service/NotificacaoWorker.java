package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.StatusNotificacao;
import com.ravtec.delivery.repository.NotificacaoOutboxRepository;
import com.ravtec.delivery.repository.PreferenciaNotificacaoRepository;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificacaoWorker {
    private final NotificacaoOutboxRepository repository;
    private final PreferenciaNotificacaoRepository preferencias;
    private final NotificacaoProvider provider;

    // Each call owns one row until commit. Other workers skip the locked row.
    @Transactional
    public boolean processarUma() {
        var proxima = repository.reservarProxima(OffsetDateTime.now());
        if (proxima.isEmpty()) return false;
        var item = proxima.get();
        if (item.getCliente() == null || !item.getCliente().isAtivo()
            || preferencias.findByClienteId(item.getCliente().getId())
                .map(p -> !p.isEmailAtivo()).orElse(false)) {
            item.setStatus(StatusNotificacao.DESATIVADA);
            return true;
        }
        try {
            item.setTentativas(item.getTentativas() + 1);
            provider.enviar(item);
            item.setStatus(StatusNotificacao.ENVIADA);
            item.setProcessadaEm(OffsetDateTime.now());
            item.setUltimoErro(null);
        } catch (RuntimeException exception) {
            item.setUltimoErro("Falha do provedor; consultar monitoramento");
            item.setStatus(item.getTentativas() >= 5 ? StatusNotificacao.FALHOU : StatusNotificacao.PENDENTE);
            item.setProximaTentativaEm(OffsetDateTime.now().plusMinutes(item.getTentativas()));
        }
        return true;
    }
}
