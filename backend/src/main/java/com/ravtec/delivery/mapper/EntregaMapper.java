package com.ravtec.delivery.mapper;

import com.ravtec.delivery.dto.EntregaClienteResponse;
import com.ravtec.delivery.dto.EntregaOperacionalResponse;
import com.ravtec.delivery.dto.EntregaResponse;
import com.ravtec.delivery.dto.HistoricoClienteResponse;
import com.ravtec.delivery.dto.HistoricoEntregaResponse;
import com.ravtec.delivery.dto.HistoricoOperacionalResponse;
import com.ravtec.delivery.entity.Entrega;
import org.springframework.stereotype.Component;

@Component
public class EntregaMapper {
    public EntregaResponse toResponse(Entrega entrega) {
        var historico = entrega.getHistorico().stream()
            .map(item -> new HistoricoEntregaResponse(
                item.getStatusAnterior(), item.getNovoStatus(), item.getUsuarioResponsavel().getNome(), item.getAlteradoEm()
            )).toList();
        return new EntregaResponse(
            entrega.getId(), entrega.getCodigo(), entrega.getCliente().getId(), entrega.getCliente().getNome(),
            entrega.getEntregador() == null ? null : entrega.getEntregador().getId(),
            entrega.getEntregador() == null ? null : entrega.getEntregador().getNome(),
            entrega.getEnderecoOrigem(), entrega.getBairroOrigem(), entrega.getEnderecoDestino(),
            entrega.getBairroDestino(), entrega.getDestinatarioNome(), entrega.getDestinatarioTelefone(),
            entrega.getDescricaoMercadoria(), entrega.getObservacoes(), entrega.getDistanciaKm(),
            entrega.getTaxaInicial(), entrega.getValorPorKm(), entrega.getValorCalculado(), entrega.getValorFinal(),
            entrega.getObservacaoValorManual(), entrega.getTipoVeiculo(), entrega.getOrigemPreco(),
            entrega.getAreaPrecoCodigo(), entrega.getAreaPrecoNome(), entrega.getTarifaBairro(),
            entrega.isPossuiRetorno(), entrega.getTaxaRetornoAplicada(), entrega.getTempoEsperaMinutos(),
            entrega.getTaxaEsperaAplicada(), entrega.getValorNegociado(), entrega.getStatus(),
            entrega.getConcluidaEm(), entrega.getCriadoEm(),
            historico, entrega.getVersion()
        );
    }

    public EntregaClienteResponse toClienteResponse(Entrega entrega) {
        var historico = entrega.getHistorico().stream()
            .map(item -> new HistoricoClienteResponse(item.getStatusAnterior(), item.getNovoStatus(), item.getAlteradoEm()))
            .toList();
        return new EntregaClienteResponse(
            entrega.getId(), entrega.getCodigo(), entrega.getEnderecoOrigem(), entrega.getBairroOrigem(),
            entrega.getEnderecoDestino(), entrega.getBairroDestino(), entrega.getDestinatarioNome(),
            entrega.getDescricaoMercadoria(), entrega.getValorFinal(), entrega.getStatus(), entrega.getConcluidaEm(),
            entrega.getCriadoEm(), historico
        );
    }

    public EntregaOperacionalResponse toOperacionalResponse(Entrega entrega) {
        var historico = entrega.getHistorico().stream()
            .map(item -> new HistoricoOperacionalResponse(item.getStatusAnterior(), item.getNovoStatus(), item.getAlteradoEm()))
            .toList();
        return new EntregaOperacionalResponse(
            entrega.getId(), entrega.getCodigo(), entrega.getCliente().getNome(), entrega.getEnderecoOrigem(),
            entrega.getBairroOrigem(), entrega.getEnderecoDestino(), entrega.getBairroDestino(),
            entrega.getDestinatarioNome(), entrega.getDestinatarioTelefone(), entrega.getDescricaoMercadoria(),
            entrega.getObservacoes(), entrega.getStatus(), entrega.getConcluidaEm(), entrega.getCriadoEm(),
            historico, entrega.getVersion()
        );
    }
}
