package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.ParadaEntregaRepository;
import java.time.OffsetDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ParadaEntregaService {
    private final ParadaEntregaRepository repository;
    private final EntregaAcessoService acessoService;
    private final NormalizacaoService normalizacaoService;
    private final AuditoriaService auditoriaService;

    @Transactional
    public List<ParadaResponse> substituir(Entrega entrega, List<ParadaRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            requests = List.of(
                new ParadaRequest(1, TipoParada.COLETA, entrega.getEnderecoOrigem(), null, false, null,
                    entrega.getBairroOrigem(), null, null, null, null, null, null, null),
                new ParadaRequest(2, TipoParada.ENTREGA, entrega.getEnderecoDestino(), null, false, null,
                    entrega.getBairroDestino(), null, null, null, entrega.getDestinatarioNome(),
                    entrega.getDestinatarioTelefone(), null, null)
            );
        }
        validarOrdem(requests);
        var existentes = repository.findByEntregaIdOrderByOrdem(entrega.getId());
        if (!existentes.isEmpty()) {
            throw new IllegalStateException("Paradas existentes nao podem ser substituidas silenciosamente");
        }
        var entidades = requests.stream().map(request -> criar(entrega, request)).toList();
        return repository.saveAll(entidades).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ParadaResponse> listar(UUID entregaId) {
        acessoService.exigirLeitura(entregaId);
        return repository.findByEntregaIdOrderByOrdem(entregaId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ParadaResponse concluirMinhaParada(UUID entregaId, UUID paradaId, Long versao) {
        var entrega = acessoService.exigirDoEntregador(entregaId);
        var paradas = repository.findByEntregaIdOrderByOrdem(entregaId);
        var parada = paradas.stream().filter(item -> item.getId().equals(paradaId)).findFirst()
            .orElseThrow(() -> new RecursoNaoEncontradoException("Parada nao encontrada"));
        if (versao != null && !Objects.equals(versao, parada.getVersion())) {
            throw new IllegalStateException("A parada foi alterada; recarregue os dados");
        }
        boolean anteriorPendente = paradas.stream()
            .anyMatch(item -> item.getOrdem() < parada.getOrdem() && item.getStatus() == StatusParada.PENDENTE);
        if (anteriorPendente) {
            throw new IllegalStateException("Conclua as paradas anteriores primeiro");
        }
        parada.setStatus(StatusParada.CONCLUIDA);
        parada.setRealizadaEm(OffsetDateTime.now());
        auditoriaService.registrar("PARADA_CONCLUIDA", "PARADA", parada.getId(), null,
            Map.of("entregaId", entrega.getId(), "ordem", parada.getOrdem()), null);
        return toResponse(parada);
    }

    private void validarOrdem(List<ParadaRequest> requests) {
        var ordens = requests.stream().map(ParadaRequest::ordem).sorted().toList();
        for (int i = 0; i < ordens.size(); i++) {
            if (ordens.get(i) != i + 1) throw new IllegalArgumentException("A ordem das paradas deve ser continua");
        }
        if (requests.stream().filter(p -> p.tipo() == TipoParada.COLETA).count() < 1
            || requests.stream().filter(p -> p.tipo() == TipoParada.ENTREGA).count() < 1) {
            throw new IllegalArgumentException("Informe ao menos uma coleta e uma entrega");
        }
    }

    private ParadaEntrega criar(Entrega entrega, ParadaRequest r) {
        var p = new ParadaEntrega();
        p.setEntrega(entrega); p.setOrdem(r.ordem()); p.setTipo(r.tipo());
        p.setLogradouro(r.logradouro().trim()); p.setNumero(limpar(r.numero())); p.setSemNumero(r.semNumero());
        p.setComplemento(limpar(r.complemento())); p.setBairro(r.bairro().trim());
        p.setCidade(limpar(r.cidade())); p.setEstado(r.estado() == null ? null : r.estado().toUpperCase());
        p.setCep(r.cep()); p.setContatoNome(limpar(r.contatoNome()));
        p.setContatoTelefone(r.contatoTelefone() == null || r.contatoTelefone().isBlank()
            ? null : normalizacaoService.telefoneObrigatorio(r.contatoTelefone()));
        p.setObservacao(limpar(r.observacao())); p.setPrevistaEm(r.previstaEm());
        return p;
    }

    private ParadaResponse toResponse(ParadaEntrega p) {
        String endereco = p.getLogradouro() + (p.isSemNumero() ? ", S/N" :
            p.getNumero() == null ? "" : ", " + p.getNumero()) + " - " + p.getBairro();
        return new ParadaResponse(p.getId(), p.getOrdem(), p.getTipo(), endereco, p.getContatoNome(),
            p.getContatoTelefone(), p.getObservacao(), p.getStatus(), p.getPrevistaEm(),
            p.getRealizadaEm(), p.getVersion());
    }

    private String limpar(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
