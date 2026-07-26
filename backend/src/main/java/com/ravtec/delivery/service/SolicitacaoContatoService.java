package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ContatoPublicoRequest;
import com.ravtec.delivery.dto.ContatoPublicoResponse;
import com.ravtec.delivery.dto.SolicitacaoContatoResponse;
import com.ravtec.delivery.entity.SolicitacaoContato;
import com.ravtec.delivery.entity.StatusSolicitacaoContato;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.SolicitacaoContatoRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SolicitacaoContatoService {

    private final SolicitacaoContatoRepository repository;
    private final ContatoRateLimitService rateLimitService;

    @Transactional
    public ContatoPublicoResponse registrar(ContatoPublicoRequest request, String remoteAddress) {
        rateLimitService.verificar(remoteAddress);
        if (request.website() != null && !request.website().isBlank()) {
            return confirmacao(UUID.randomUUID(), OffsetDateTime.now());
        }

        var contato = new SolicitacaoContato();
        contato.setNome(request.nome().trim());
        contato.setEmpresa(limpar(request.empresa()));
        contato.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        contato.setTelefone(request.telefone().replaceAll("\\D", ""));
        contato.setMensagem(request.mensagem().trim());
        contato.setStatus(StatusSolicitacaoContato.NOVA);
        var salvo = repository.save(contato);
        return confirmacao(salvo.getId(), salvo.getCriadoEm());
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoContatoResponse> listar(StatusSolicitacaoContato status) {
        var itens = status == null
            ? repository.findAllByOrderByCriadoEmDesc()
            : repository.findByStatusOrderByCriadoEmDesc(status);
        return itens.stream().map(this::toResponse).toList();
    }

    @Transactional
    public SolicitacaoContatoResponse alterarStatus(UUID id, StatusSolicitacaoContato status) {
        var contato = repository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Solicitacao de contato nao encontrada"));
        contato.setStatus(status);
        return toResponse(contato);
    }

    private ContatoPublicoResponse confirmacao(UUID id, OffsetDateTime recebidoEm) {
        return new ContatoPublicoResponse(
            "JSB-C-" + id.toString().substring(0, 8).toUpperCase(Locale.ROOT),
            recebidoEm,
            "Solicitacao recebida. Guarde o protocolo para acompanhamento"
        );
    }

    private SolicitacaoContatoResponse toResponse(SolicitacaoContato item) {
        return new SolicitacaoContatoResponse(
            item.getId(),
            "JSB-C-" + item.getId().toString().substring(0, 8).toUpperCase(Locale.ROOT),
            item.getNome(),
            item.getEmpresa(),
            item.getEmail(),
            item.getTelefone(),
            item.getMensagem(),
            item.getStatus(),
            item.getCriadoEm()
        );
    }

    private String limpar(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
