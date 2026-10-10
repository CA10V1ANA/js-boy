package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.*;
import com.ravtec.delivery.mapper.EntregaMapper;
import com.ravtec.delivery.repository.EntregaFinanceiraRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PedidoClienteService {

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private final EntregaAcessoService acesso;
    private final IdentidadeAtual identidade;
    private final EntregaFinanceiraRepository entregas;
    private final EntregaService entregaService;
    private final EntregaMapper mapper;
    private final ParadaEntregaService paradas;
    private final RecebimentoService recebimentos;
    private final TabelaPrecoService precos;
    private final VersionamentoService versoes;
    private final AuditoriaService auditoria;

    public record Edicao(SolicitacaoEntregaClienteRequest solicitacao, long versao) {}

    private Entrega exigir(UUID id) {
        identidade.clienteObrigatorio();
        return acesso.exigirLeitura(id);
    }

    private void editavel(Entrega e) {
        if (
            e.getStatus() != StatusEntrega.SOLICITADA || e.getEntregador() != null
        ) throw new ConflitoException("A solicitação só pode ser editada antes da análise");
        if (paradas.possuiMultiplosLocais(e.getId())) throw new ConflitoException(
            "Peça à JS Boy a revisão de uma rota com vários locais"
        );
        recebimentos.exigirSemRecebimento(e);
    }

    @Transactional(readOnly = true)
    public Edicao consultar(UUID id) {
        var e = exigir(id);
        editavel(e);
        return new Edicao(
            new SolicitacaoEntregaClienteRequest(
                e.getEnderecoOrigem(),
                e.getBairroOrigem(),
                e.getEnderecoDestino(),
                e.getBairroDestino(),
                e.getDestinatarioNome(),
                e.getDestinatarioTelefone(),
                e.getDescricaoMercadoria(),
                e.getObservacoes(),
                e.getDistanciaKm(),
                e.getAgendadaInicio(),
                e.getAgendadaFim(),
                e.getFusoHorario(),
                null,
                e.getFormaPagamento()
            ),
            e.getVersion()
        );
    }

    @Transactional
    public EntregaClienteResponse editar(UUID id, Long versao, SolicitacaoEntregaClienteRequest r) {
        exigir(id);
        var e = entregas.buscarParaAtualizacao(id).orElseThrow();
        entityManager.refresh(e);
        exigir(id);
        editavel(e);
        versoes.validar(versao, e.getVersion());
        if (r.paradas() != null && !r.paradas().isEmpty()) throw new IllegalArgumentException(
            "Revise os dois endereços no formulário"
        );
        SolicitacaoEntregaClienteService.validarAgendamento(r);
        var calculo = precos.calcular(r.bairroDestino(), TipoVeiculo.MOTO, 0, false, null, r.distanciaKm());
        entregaService.atualizar(
            id,
            new EntregaRequest(
                e.getCliente().getId(),
                null,
                r.enderecoOrigem(),
                r.bairroOrigem(),
                r.enderecoDestino(),
                r.bairroDestino(),
                r.destinatarioNome(),
                r.destinatarioTelefone(),
                r.descricaoMercadoria(),
                r.observacoes(),
                r.distanciaKm(),
                null,
                null,
                TipoVeiculo.MOTO,
                0,
                false,
                calculo.valorNegociadoObrigatorio() ? BigDecimal.ZERO : null,
                r.formaPagamento(),
                null
            ),
            versao
        );
        if (calculo.valorNegociadoObrigatorio()) e.setValorNegociado(null);
        e.setAgendadaInicio(r.agendadaInicio());
        e.setAgendadaFim(r.agendadaFim());
        e.setFusoHorario(r.fusoHorario());
        entregas.flush();
        return mapper.toClienteResponse(e);
    }

    @Transactional(readOnly = true)
    public Long versaoCancelamento(UUID id) {
        var e = exigir(id);
        new EntregaStatusPolicy().validarEdicaoAntesDaColeta(e.getStatus());
        return e.getVersion();
    }

    @Transactional
    public void cancelar(UUID id, Long versao, String motivo) {
        exigir(id);
        var e = entregas.buscarParaAtualizacao(id).orElseThrow();
        exigir(id);
        if (e.getStatus() == StatusEntrega.CANCELADA) return;
        new EntregaStatusPolicy().validarEdicaoAntesDaColeta(e.getStatus());
        recebimentos.exigirSemRecebimento(e);
        entregaService.alterarStatus(id, new EntregaStatusRequest(StatusEntrega.CANCELADA), versao);
        auditoria.registrar(
            "CANCELAMENTO_CLIENTE",
            "ENTREGA",
            id,
            null,
            Map.of("contexto", "CLIENTE"),
            motivo
        );
    }
}
