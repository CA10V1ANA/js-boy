package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OcorrenciaEntregaService {
    private final OcorrenciaEntregaRepository repository;
    private final ParadaEntregaRepository paradaRepository;
    private final EntregaAcessoService acessoService;
    private final EntregaService entregaService;
    private final AuditoriaService auditoriaService;

    @Transactional
    public OcorrenciaResponse registrar(UUID entregaId, OcorrenciaRequest request) {
        var entrega = acessoService.exigirDoEntregador(entregaId);
        var parada = request.paradaId() == null ? null
            : paradaRepository.findByIdAndEntregaId(request.paradaId(), entregaId).orElseThrow();
        var ocorrencia = new OcorrenciaEntrega();
        ocorrencia.setEntrega(entrega); ocorrencia.setParada(parada);
        ocorrencia.setEntregador(entrega.getEntregador()); ocorrencia.setTipo(request.tipo());
        ocorrencia.setMotivo(request.motivo().trim()); ocorrencia.setObservacao(limpar(request.observacao()));
        ocorrencia.setProximaAcao(request.proximaAcao().trim());
        repository.save(ocorrencia);
        if (parada != null) parada.setStatus(StatusParada.FALHOU);
        var destino = switch (request.tipo()) {
            case DEVOLUCAO -> StatusEntrega.EM_DEVOLUCAO;
            case FALHA_OPERACIONAL, MERCADORIA_COM_PROBLEMA -> StatusEntrega.FALHA_OPERACIONAL;
            default -> StatusEntrega.TENTATIVA_FALHOU;
        };
        entregaService.alterarStatusMinhaEntrega(entregaId, new EntregaStatusRequest(destino), entrega.getVersion());
        auditoriaService.registrar("OCORRENCIA_REGISTRADA", "ENTREGA", entregaId, null,
            Map.of("ocorrenciaId", ocorrencia.getId(), "tipo", request.tipo().name()), request.motivo());
        return toResponse(ocorrencia);
    }

    @Transactional(readOnly = true)
    public List<OcorrenciaResponse> listar(UUID entregaId) {
        acessoService.exigirLeitura(entregaId);
        return repository.findByEntregaIdOrderByOcorridaEmDesc(entregaId).stream().map(this::toResponse).toList();
    }

    private OcorrenciaResponse toResponse(OcorrenciaEntrega o) {
        return new OcorrenciaResponse(o.getId(), o.getParada() == null ? null : o.getParada().getId(),
            o.getTipo(), o.getMotivo(), o.getObservacao(), o.getProximaAcao(), o.getOcorridaEm());
    }
    private String limpar(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
