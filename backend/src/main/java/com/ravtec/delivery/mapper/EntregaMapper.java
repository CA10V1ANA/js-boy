package com.ravtec.delivery.mapper;

import com.ravtec.delivery.dto.EntregaResponse;
import com.ravtec.delivery.dto.HistoricoEntregaResponse;
import com.ravtec.delivery.entity.Entrega;
import org.springframework.stereotype.Component;

@Component
public class EntregaMapper {

    public EntregaResponse toResponse(Entrega entrega) {
        var historico = entrega.getHistorico().stream()
            .map(item -> new HistoricoEntregaResponse(
                item.getStatusAnterior(),
                item.getNovoStatus(),
                item.getUsuarioResponsavel().getNome(),
                item.getAlteradoEm()
            ))
            .toList();

        return new EntregaResponse(
            entrega.getId(),
            entrega.getCodigo(),
            entrega.getCliente().getId(),
            entrega.getCliente().getNome(),
            entrega.getEntregador() == null ? null : entrega.getEntregador().getId(),
            entrega.getEntregador() == null ? null : entrega.getEntregador().getNome(),
            entrega.getEnderecoOrigem(),
            entrega.getBairroOrigem(),
            entrega.getEnderecoDestino(),
            entrega.getBairroDestino(),
            entrega.getDestinatarioNome(),
            entrega.getDestinatarioTelefone(),
            entrega.getDescricaoMercadoria(),
            entrega.getObservacoes(),
            entrega.getDistanciaKm(),
            entrega.getTaxaInicial(),
            entrega.getValorPorKm(),
            entrega.getValorCalculado(),
            entrega.getValorFinal(),
            entrega.getObservacaoValorManual(),
            entrega.getStatus(),
            entrega.getConcluidaEm(),
            entrega.getCriadoEm(),
            historico
        );
    }
}
