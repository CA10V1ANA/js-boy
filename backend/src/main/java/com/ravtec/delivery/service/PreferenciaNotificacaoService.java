package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.PreferenciaNotificacao;
import com.ravtec.delivery.repository.PreferenciaNotificacaoRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PreferenciaNotificacaoService {
    private final PreferenciaNotificacaoRepository repository;
    private final IdentidadeAtual identidadeAtual;

    @Transactional(readOnly = true)
    public PreferenciaNotificacaoResponse consultar() {
        var cliente = identidadeAtual.clienteObrigatorio();
        return repository.findByClienteId(cliente.getId()).map(this::toResponse)
            .orElse(new PreferenciaNotificacaoResponse(true, false, false));
    }

    @Transactional
    public PreferenciaNotificacaoResponse salvar(PreferenciaNotificacaoRequest request) {
        var cliente = identidadeAtual.clienteObrigatorio();
        var item = repository.findByClienteId(cliente.getId()).orElseGet(() -> {
            var novo = new PreferenciaNotificacao();
            novo.setCliente(cliente);
            return novo;
        });
        item.setEmailAtivo(request.emailAtivo());
        item.setWhatsappAtivo(request.whatsappAtivo());
        item.setSmsAtivo(request.smsAtivo());
        return toResponse(repository.save(item));
    }

    private PreferenciaNotificacaoResponse toResponse(PreferenciaNotificacao p) {
        return new PreferenciaNotificacaoResponse(p.isEmailAtivo(), p.isWhatsappAtivo(), p.isSmsAtivo());
    }
}
