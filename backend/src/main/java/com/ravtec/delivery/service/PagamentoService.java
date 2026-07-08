package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.PagamentoRequest;
import com.ravtec.delivery.dto.PagamentoResponse;
import com.ravtec.delivery.dto.PendenciaFinanceiraResponse;
import com.ravtec.delivery.dto.RelatorioFinanceiroResponse;
import com.ravtec.delivery.entity.Pagamento;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.PagamentoMapper;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.repository.PagamentoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagamentoService {

    private final PagamentoRepository pagamentoRepository;
    private final EntregaRepository entregaRepository;
    private final PagamentoMapper pagamentoMapper;

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listar() {
        return pagamentoRepository.findAll().stream()
            .map(pagamentoMapper::toResponse)
            .toList();
    }

    @Transactional
    public PagamentoResponse registrar(PagamentoRequest request) {
        var entrega = entregaRepository.findById(request.entregaId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));

        var pagamento = new Pagamento();
        pagamento.setEntrega(entrega);
        pagamento.setValor(request.valor().setScale(2, RoundingMode.HALF_UP));
        pagamento.setFormaPagamento(request.formaPagamento());
        pagamento.setPagoEm(request.pagoEm() == null ? OffsetDateTime.now() : request.pagoEm());
        pagamento.setComprovante(request.comprovante());
        pagamento.setObservacoes(request.observacoes());

        var salvo = pagamentoRepository.save(pagamento);
        log.info("Pagamento registrado: entrega={} valor={} forma={}", entrega.getCodigo(), salvo.getValor(), salvo.getFormaPagamento());
        return pagamentoMapper.toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public RelatorioFinanceiroResponse relatorio() {
        var valorEntregas = entregaRepository.somarValorTotal();
        var valorRecebido = pagamentoRepository.somarPagamentos();
        var pendencias = calcularPendencias();

        return new RelatorioFinanceiroResponse(
            valorEntregas,
            valorRecebido,
            valorEntregas.subtract(valorRecebido).max(BigDecimal.ZERO),
            pagamentoRepository.count(),
            pendencias
        );
    }

    private List<PendenciaFinanceiraResponse> calcularPendencias() {
        return entregaRepository.findAll().stream()
            .map(entrega -> {
                var valorPago = pagamentoRepository.findByEntregaId(entrega.getId()).stream()
                    .map(Pagamento::getValor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                var pendente = entrega.getValorFinal().subtract(valorPago).max(BigDecimal.ZERO);
                return new PendenciaFinanceiraResponse(
                    entrega.getId(),
                    entrega.getCodigo(),
                    entrega.getCliente().getNome(),
                    entrega.getValorFinal(),
                    valorPago,
                    pendente
                );
            })
            .filter(item -> item.valorPendente().compareTo(BigDecimal.ZERO) > 0)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listarPorEntrega(UUID entregaId) {
        return pagamentoRepository.findByEntregaId(entregaId).stream()
            .map(pagamentoMapper::toResponse)
            .toList();
    }
}
