package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.*;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.*;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RazaoFinanceiraService {
    private final LancamentoRazaoRepository razao;
    private final FechamentoFinanceiroRepository fechamentos;
    private final ClienteRepository clientes;
    private final EntregadorRepository entregadores;
    private final EntregaRepository entregas;
    private final PagamentoRepository pagamentos;
    private final IdentidadeAtual identidade;
    private final TokenSeguroService hash;
    private final AuditoriaService auditoria;
    @Value("${app.business-zone:America/Fortaleza}") private String zona;

    @Transactional
    public LancamentoRazaoResponse registrar(String chave, LancamentoRazaoRequest request) {
        validarChave(chave);
        if (fechamentos.existsByInicioLessThanEqualAndFimGreaterThanEqualAndReabertoEmIsNull(
            request.competencia(), request.competencia())) {
            throw new ConflitoException("Periodo financeiro fechado");
        }
        String payload = hash.hash(request.toString());
        var existente = razao.findByChaveIdempotencia(chave).orElse(null);
        if (existente != null) {
            if (!existente.getPayloadHash().equals(payload)) throw new ConflitoException("Chave reutilizada com dados diferentes");
            return toResponse(existente);
        }
        if (request.tipo() == TipoLancamentoRazao.RECEITA || request.tipo() == TipoLancamentoRazao.ESTORNO) {
            throw new IllegalArgumentException("Receitas e estornos devem ser registrados pelo modulo de pagamentos");
        }
        var item = new LancamentoRazao();
        item.setTipo(request.tipo()); item.setDescricao(request.descricao().trim());
        item.setValor(request.valor().setScale(2, RoundingMode.HALF_UP));
        item.setCompetencia(request.competencia());
        item.setOcorridoEm(request.ocorridoEm() == null ? OffsetDateTime.now(ZoneId.of(zona)) : request.ocorridoEm());
        item.setCliente(optional(clientes, request.clienteId()));
        item.setEntregador(optional(entregadores, request.entregadorId()));
        item.setEntrega(optional(entregas, request.entregaId()));
        item.setLancamentoOriginal(optional(razao, request.lancamentoOriginalId()));
        item.setUsuarioResponsavel(identidade.usuario()); item.setChaveIdempotencia(chave);
        item.setPayloadHash(payload); item.setObservacao(limpar(request.observacao()));
        razao.save(item);
        auditoria.registrar("LANCAMENTO_RAZAO_CRIADO", "LANCAMENTO_RAZAO", item.getId(), null,
            Map.of("tipo", item.getTipo(), "valor", item.getValor(), "competencia", item.getCompetencia()), null);
        return toResponse(item);
    }

    @Transactional
    public UUID fechar(LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);
        if (fechamentos.findByInicioAndFim(inicio, fim).filter(FechamentoFinanceiro::fechado).isPresent()) {
            throw new ConflitoException("Periodo ja fechado");
        }
        var item = new FechamentoFinanceiro();
        item.setInicio(inicio); item.setFim(fim); item.setFechadoEm(OffsetDateTime.now(ZoneId.of(zona)));
        item.setUsuarioFechamento(identidade.usuario()); fechamentos.save(item);
        auditoria.registrar("PERIODO_FINANCEIRO_FECHADO", "FECHAMENTO", item.getId(), null,
            Map.of("inicio", inicio, "fim", fim), null);
        return item.getId();
    }

    @Transactional
    public void reabrir(UUID id, String motivo) {
        if (motivo == null || motivo.isBlank()) throw new IllegalArgumentException("Motivo obrigatorio");
        var item = fechamentos.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Fechamento nao encontrado"));
        if (!item.fechado()) throw new ConflitoException("Periodo ja reaberto");
        item.setReabertoEm(OffsetDateTime.now(ZoneId.of(zona))); item.setMotivoReabertura(motivo.trim());
        item.setUsuarioReabertura(identidade.usuario());
        auditoria.registrar("PERIODO_FINANCEIRO_REABERTO", "FECHAMENTO", id, null,
            Map.of("inicio", item.getInicio(), "fim", item.getFim()), motivo);
    }

    @Transactional(readOnly = true)
    public RelatorioRazaoResponse relatorio(LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);
        ZoneId zone = ZoneId.of(zona);
        var entregasPeriodo = entregas.findAll().stream().filter(e -> {
            var data = e.getCriadoEm().atZoneSameInstant(zone).toLocalDate();
            return !data.isBefore(inicio) && !data.isAfter(fim) && e.getStatus() != StatusEntrega.CANCELADA;
        }).toList();
        var pagamentosPeriodo = pagamentos.findAll().stream().filter(p -> {
            var data = p.getPagoEm().atZoneSameInstant(zone).toLocalDate();
            return !data.isBefore(inicio) && !data.isAfter(fim);
        }).toList();
        var lancamentos = razao.findByCompetenciaBetweenOrderByOcorridoEm(inicio, fim);
        BigDecimal faturado = soma(entregasPeriodo.stream().map(Entrega::getValorFinal).toList());
        BigDecimal recebido = soma(pagamentosPeriodo.stream().filter(p -> p.getTipo() == TipoLancamentoFinanceiro.RECEBIMENTO).map(Pagamento::getValor).toList());
        BigDecimal estornado = soma(pagamentosPeriodo.stream().filter(p -> p.getTipo() == TipoLancamentoFinanceiro.ESTORNO).map(Pagamento::getValor).toList());
        BigDecimal despesas = somaTipo(lancamentos, TipoLancamentoRazao.DESPESA, TipoLancamentoRazao.AJUSTE_DEBITO);
        BigDecimal taxas = somaTipo(lancamentos, TipoLancamentoRazao.TAXA);
        BigDecimal repasses = somaTipo(lancamentos, TipoLancamentoRazao.REPASSE_ENTREGADOR);
        BigDecimal creditos = somaTipo(lancamentos, TipoLancamentoRazao.AJUSTE_CREDITO);
        BigDecimal liquidoRecebido = recebido.subtract(estornado);
        return new RelatorioRazaoResponse(inicio, fim, faturado, recebido,
            faturado.subtract(liquidoRecebido).max(BigDecimal.ZERO), estornado, despesas, taxas, repasses,
            liquidoRecebido.add(creditos).subtract(despesas).subtract(taxas).subtract(repasses),
            entregasPeriodo.stream().collect(Collectors.groupingBy(e -> e.getCliente().getNome(), Collectors.counting())),
            entregasPeriodo.stream().filter(e -> e.getEntregador() != null)
                .collect(Collectors.groupingBy(e -> e.getEntregador().getNome(), Collectors.counting())));
    }

    private BigDecimal somaTipo(List<LancamentoRazao> items, TipoLancamentoRazao... tipos) {
        var allowed = EnumSet.copyOf(Arrays.asList(tipos));
        return soma(items.stream().filter(i -> allowed.contains(i.getTipo())).map(LancamentoRazao::getValor).toList());
    }
    private BigDecimal soma(List<BigDecimal> valores) { return valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add); }
    private <T> T optional(org.springframework.data.jpa.repository.JpaRepository<T, UUID> repo, UUID id) {
        return id == null ? null : repo.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Referencia nao encontrada"));
    }
    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null || fim.isBefore(inicio) || fim.isAfter(inicio.plusYears(1))) {
            throw new IllegalArgumentException("Periodo invalido");
        }
    }
    private void validarChave(String chave) {
        if (chave == null || !chave.matches("[A-Za-z0-9._:-]{8,128}")) throw new IllegalArgumentException("Idempotency-Key invalida");
    }
    private String limpar(String v) { return v == null || v.isBlank() ? null : v.trim(); }
    private LancamentoRazaoResponse toResponse(LancamentoRazao i) {
        return new LancamentoRazaoResponse(i.getId(), i.getTipo(), i.getDescricao(), i.getValor(), i.getOcorridoEm(),
            i.getCompetencia(), id(i.getCliente()), id(i.getEntregador()), id(i.getEntrega()), id(i.getLancamentoOriginal()), i.getObservacao());
    }
    private UUID id(com.ravtec.delivery.entity.BaseEntity e) { return e == null ? null : e.getId(); }
}
