package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SolicitacaoEntregaClienteService {
    private final IdentidadeAtual identidadeAtual;
    private final EntregaService entregaService;
    private final EntregaRepository entregaRepository;
    private final ParadaEntregaService paradaService;
    private final NotificacaoOutboxService notificacaoService;

    @Transactional
    public EntregaClienteResponse solicitar(SolicitacaoEntregaClienteRequest request) {
        var cliente = identidadeAtual.clienteObrigatorio();
        validarAgendamento(request);
        var criada = entregaService.criar(new EntregaRequest(
            cliente.getId(), null, request.enderecoOrigem(), request.bairroOrigem(),
            request.enderecoDestino(), request.bairroDestino(), request.destinatarioNome(),
            request.destinatarioTelefone(), request.descricaoMercadoria(), request.observacoes(),
            request.distanciaKm(), null, null
        ));
        var entrega = entregaRepository.findById(criada.id()).orElseThrow();
        entrega.setAgendadaInicio(request.agendadaInicio());
        entrega.setAgendadaFim(request.agendadaFim());
        entrega.setFusoHorario(request.fusoHorario());
        entrega.setStatus(StatusEntrega.SOLICITADA);
        paradaService.substituir(entrega, request.paradas());
        notificacaoService.enfileirar(entrega, "SOLICITACAO_RECEBIDA",
            "solicitacao:" + entrega.getId());
        return new EntregaClienteResponse(
            entrega.getId(), entrega.getCodigo(), entrega.getEnderecoOrigem(), entrega.getBairroOrigem(),
            entrega.getEnderecoDestino(), entrega.getBairroDestino(), entrega.getDestinatarioNome(),
            entrega.getDescricaoMercadoria(), entrega.getValorFinal(), entrega.getStatus(), entrega.getConcluidaEm(),
            entrega.getCriadoEm(), criada.historico().stream()
                .map(h -> new HistoricoClienteResponse(h.statusAnterior(), h.novoStatus(), h.alteradoEm())).toList()
        );
    }

    private void validarAgendamento(SolicitacaoEntregaClienteRequest request) {
        if (request.agendadaInicio() == null && request.agendadaFim() == null) return;
        if (request.agendadaInicio() == null || request.agendadaFim() == null
            || !request.agendadaFim().isAfter(request.agendadaInicio())) {
            throw new IllegalArgumentException("Informe uma janela de agendamento valida");
        }
        if (!request.agendadaInicio().isAfter(OffsetDateTime.now())) {
            throw new IllegalArgumentException("O agendamento deve estar no futuro");
        }
        if (request.fusoHorario() == null || request.fusoHorario().isBlank()) {
            throw new IllegalArgumentException("Informe o fuso horario");
        }
        ZoneId.of(request.fusoHorario());
    }
}
