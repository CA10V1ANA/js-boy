package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.EstornoRequest;
import com.ravtec.delivery.dto.PagamentoRequest;
import com.ravtec.delivery.dto.PagamentoResponse;
import com.ravtec.delivery.dto.PendenciaFinanceiraResponse;
import com.ravtec.delivery.dto.RelatorioFinanceiroResponse;
import com.ravtec.delivery.entity.Pagamento;
import com.ravtec.delivery.entity.TipoLancamentoFinanceiro;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.PagamentoMapper;
import com.ravtec.delivery.repository.EntregaFinanceiraRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.repository.PagamentoRepository;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagamentoService {
    private static final Pattern IDEMPOTENCY_KEY = Pattern.compile("[A-Za-z0-9._:-]{8,128}");
    private final PagamentoRepository pagamentoRepository;
    private final EntregaRepository entregaRepository;
    private final EntregaFinanceiraRepository entregaFinanceiraRepository;
    private final PagamentoMapper pagamentoMapper;
    @Autowired(required = false)
    private AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listar() {
        return pagamentoRepository.findAll().stream().map(pagamentoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listarDoClienteAtual() {
        var principal = usuarioAtual();
        if (principal.getUsuario().getCliente() == null) {
            throw new AccessDeniedException("Usuario cliente sem vinculo ativo");
        }
        return pagamentoRepository.findByEntregaClienteUsuarioIdOrderByPagoEmDesc(principal.getId()).stream()
            .map(pagamentoMapper::toResponse).toList();
    }

    @Transactional
    public PagamentoResponse registrar(String idempotencyKey, PagamentoRequest request) {
        var chave = validarChave(idempotencyKey);
        var entrega = entregaFinanceiraRepository.buscarParaAtualizacao(request.entregaId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
        var valor = monetario(request.valor());
        validarValorPositivo(valor);
        validarData(request.pagoEm());
        var hash = hashRecebimento(request, valor);
        var existente = buscarIdempotente(chave, hash);
        if (existente != null) {
            return pagamentoMapper.toResponse(existente);
        }
        var recebido = pagamentoRepository.somarSaldoPorEntrega(entrega.getId());
        var saldo = monetario(entrega.getValorFinal().subtract(recebido));
        if (valor.compareTo(saldo) > 0) {
            throw new ConflitoException("Pagamento excede o saldo disponivel da entrega");
        }
        var pagamento = new Pagamento();
        pagamento.setEntrega(entrega);
        pagamento.setValor(valor);
        pagamento.setFormaPagamento(request.formaPagamento());
        pagamento.setTipo(TipoLancamentoFinanceiro.RECEBIMENTO);
        pagamento.setPagoEm(request.pagoEm() == null ? OffsetDateTime.now() : request.pagoEm());
        pagamento.setComprovante(limpar(request.comprovante()));
        pagamento.setObservacoes(limpar(request.observacoes()));
        pagamento.setUsuarioResponsavel(usuarioAtual().getUsuario());
        pagamento.setIdempotencyKey(chave);
        pagamento.setPayloadHash(hash);
        var salvo = pagamentoRepository.saveAndFlush(pagamento);
        auditar("PAGAMENTO_REGISTRADO", salvo, Map.of(
            "entregaId", entrega.getId(), "valor", valor, "forma", request.formaPagamento().name()
        ), null);
        log.info("finance_event=payment_registered payment_id={} delivery_id={} result=success",
            salvo.getId(), entrega.getId());
        return pagamentoMapper.toResponse(salvo);
    }

    @Transactional
    public PagamentoResponse estornar(UUID pagamentoId, String idempotencyKey, EstornoRequest request) {
        var chave = validarChave(idempotencyKey);
        var originalSemLock = pagamentoRepository.findById(pagamentoId)
            .filter(item -> item.getTipo() == TipoLancamentoFinanceiro.RECEBIMENTO)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Pagamento nao encontrado"));
        entregaFinanceiraRepository.buscarParaAtualizacao(originalSemLock.getEntrega().getId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
        var original = pagamentoRepository.findById(pagamentoId)
            .filter(item -> item.getTipo() == TipoLancamentoFinanceiro.RECEBIMENTO)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Pagamento nao encontrado"));
        var valor = monetario(request.valor());
        validarValorPositivo(valor);
        var hash = hashEstorno(original.getId(), request, valor);
        var existente = buscarIdempotente(chave, hash);
        if (existente != null) {
            return pagamentoMapper.toResponse(existente);
        }
        var jaEstornado = pagamentoRepository.somarEstornosDoLancamento(original.getId());
        var disponivel = monetario(original.getValor().subtract(jaEstornado));
        if (valor.compareTo(disponivel) > 0) {
            throw new ConflitoException("Estorno excede o valor liquido disponivel do pagamento");
        }
        var estorno = new Pagamento();
        estorno.setEntrega(original.getEntrega());
        estorno.setValor(valor);
        estorno.setFormaPagamento(original.getFormaPagamento());
        estorno.setTipo(TipoLancamentoFinanceiro.ESTORNO);
        estorno.setLancamentoOriginal(original);
        estorno.setUsuarioResponsavel(usuarioAtual().getUsuario());
        estorno.setIdempotencyKey(chave);
        estorno.setPayloadHash(hash);
        estorno.setPagoEm(OffsetDateTime.now());
        estorno.setMotivo(request.motivo().trim());
        var salvo = pagamentoRepository.saveAndFlush(estorno);
        auditar("ESTORNO_REGISTRADO", salvo, Map.of(
            "pagamentoOriginalId", original.getId(), "valor", valor
        ), request.motivo());
        log.info("finance_event=refund_registered refund_id={} original_id={} result=success",
            salvo.getId(), original.getId());
        return pagamentoMapper.toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public RelatorioFinanceiroResponse relatorio() {
        var valorEntregas = entregaRepository.somarValorTotal();
        var valorRecebido = pagamentoRepository.somarSaldoFinanceiro();
        return new RelatorioFinanceiroResponse(
            valorEntregas, valorRecebido, valorEntregas.subtract(valorRecebido).max(BigDecimal.ZERO),
            pagamentoRepository.countByTipo(TipoLancamentoFinanceiro.RECEBIMENTO), calcularPendencias()
        );
    }

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listarPorEntrega(UUID entregaId) {
        if (!entregaRepository.existsById(entregaId)) {
            throw new RecursoNaoEncontradoException("Entrega nao encontrada");
        }
        return pagamentoRepository.findByEntregaId(entregaId).stream().map(pagamentoMapper::toResponse).toList();
    }

    private List<PendenciaFinanceiraResponse> calcularPendencias() {
        return entregaRepository.findAll().stream().map(entrega -> {
            var valorPago = pagamentoRepository.somarSaldoPorEntrega(entrega.getId());
            var pendente = entrega.getValorFinal().subtract(valorPago).max(BigDecimal.ZERO);
            return new PendenciaFinanceiraResponse(
                entrega.getId(), entrega.getCodigo(), entrega.getCliente().getNome(),
                entrega.getValorFinal(), valorPago, pendente
            );
        }).filter(item -> item.valorPendente().compareTo(BigDecimal.ZERO) > 0).toList();
    }

    private Pagamento buscarIdempotente(String chave, String payloadHash) {
        var existente = pagamentoRepository.findByIdempotencyKey(chave).orElse(null);
        if (existente == null) {
            return null;
        }
        if (!MessageDigest.isEqual(existente.getPayloadHash().getBytes(StandardCharsets.UTF_8),
            payloadHash.getBytes(StandardCharsets.UTF_8))) {
            throw new ConflitoException("Idempotency-Key ja utilizada com dados diferentes");
        }
        return existente;
    }

    private String validarChave(String value) {
        var chave = value == null ? "" : value.trim();
        if (!IDEMPOTENCY_KEY.matcher(chave).matches()) {
            throw new IllegalArgumentException(
                "Idempotency-Key obrigatoria: use de 8 a 128 caracteres alfanumericos, ponto, hifen, dois-pontos ou sublinhado"
            );
        }
        return chave;
    }

    private void validarValorPositivo(BigDecimal valor) {
        if (valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor deve ser maior que zero");
        }
    }

    private void validarData(OffsetDateTime pagoEm) {
        if (pagoEm != null && pagoEm.isAfter(OffsetDateTime.now().plusMinutes(5))) {
            throw new IllegalArgumentException("A data do pagamento nao pode estar no futuro");
        }
    }

    private String hashRecebimento(PagamentoRequest request, BigDecimal valor) {
        return sha256(String.join("|", "RECEBIMENTO", request.entregaId().toString(), valor.toPlainString(),
            request.formaPagamento().name(), Objects.toString(request.pagoEm(), ""),
            Objects.toString(limpar(request.comprovante()), ""), Objects.toString(limpar(request.observacoes()), "")));
    }

    private String hashEstorno(UUID originalId, EstornoRequest request, BigDecimal valor) {
        return sha256(String.join("|", "ESTORNO", originalId.toString(), valor.toPlainString(), request.motivo().trim()));
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponivel", exception);
        }
    }

    private BigDecimal monetario(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String limpar(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void auditar(String acao, Pagamento item, Object depois, String motivo) {
        if (auditoriaService != null && item.getId() != null) {
            auditoriaService.registrar(acao, "PAGAMENTO", item.getId(), null, depois, motivo);
        }
    }

    private UsuarioPrincipal usuarioAtual() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)) {
            throw new AccessDeniedException("Usuario autenticado obrigatorio");
        }
        return principal;
    }
}
