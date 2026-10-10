package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecebimentoService {

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private final EntregaAcessoService acesso;
    private final EntregaFinanceiraRepository entregas;
    private final EntregadorRepository entregadores;
    private final PagamentoRepository pagamentos;
    private final ParadaEntregaRepository paradas;
    private final CobrancaPixRepository cobrancas;
    private final PagamentoService pagamentoService;
    private final IdentidadeAtual identidade;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private AuditoriaService auditoria;

    @Transactional(readOnly = true)
    public RecebimentoResponse consultarOperacional(UUID id) {
        return resumo(acesso.exigirDoEntregador(id));
    }

    @Transactional
    public PagamentoResponse confirmarOperacional(
        UUID id,
        String chave,
        ConfirmarRecebimentoRequest request
    ) {
        acesso.exigirDoEntregadorParaAtualizacao(id);
        var resultado = confirmar(id, chave, request);
        if (auditoria != null) auditoria.registrar(
            "RECEBIMENTO_CONTEXTO_OPERACIONAL",
            "PAGAMENTO",
            resultado.id(),
            null,
            Map.of("contexto", "ENTREGADOR", "entregaId", id),
            null
        );
        return resultado;
    }

    @Transactional(readOnly = true)
    public RecebimentoResponse consultar(UUID id) {
        return resumo(acesso.exigirLeitura(id));
    }

    @Transactional
    public PagamentoResponse confirmar(UUID id, String chave, ConfirmarRecebimentoRequest request) {
        var e = entregas
            .buscarParaAtualizacao(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega não encontrada"));
        autorizarConfirmacao(e);
        if (e.getEntregador() == null) throw new ConflitoException(
            "Designe o entregador que recebeu o pagamento"
        );
        // Serialize receiver edits with confirmation and refresh the data used in its fingerprint.
        var recebedor = entregadores.buscarParaAtualizacao(e.getEntregador().getId()).orElseThrow();
        entityManager.refresh(recebedor);
        e.setEntregador(recebedor);
        var tentativa = new PagamentoRequest(
            id,
            request.valor(),
            request.formaPagamento(),
            null,
            null,
            "Recebimento manual: " + request.referenciaRecebedor()
        );
        if (pagamentos.findByIdempotencyKey(chave).isPresent()) return pagamentoService.registrar(
            chave,
            tentativa
        );
        if (terminal(e)) throw new ConflitoException(
            "Entrega encerrada não aceita novas confirmações neste fluxo"
        );
        if (
            !Objects.equals(request.formaPagamento(), e.getFormaPagamento()) ||
            !Objects.equals(request.referenciaRecebedor(), referencia(e))
        ) {
            throw new ConflitoException("Pagamento ou recebedor alterado. Recarregue e confira quem recebeu");
        }
        return pagamentoService.registrar(chave, tentativa);
    }

    public void validarFinalizacao(Entrega e) {
        var motivo = pendencia(e);
        if (motivo != null) throw new ConflitoException(motivo);
    }

    public void exigirSemRecebimento(Entrega e) {
        // Full refunds allow an explicit subsequent edit; the historical ledger stays intact.
        if (pagamentos.somarSaldoPorEntrega(e.getId()).signum() > 0) throw new ConflitoException(
            "Há recebimento registrado. Concilie ou estorne antes de alterar entregador, preço ou forma de pagamento"
        );
        if (legadoPendente(e)) throw new ConflitoException(
            "Concilie a cobrança legada pendente antes de alterar os dados financeiros"
        );
    }

    private RecebimentoResponse resumo(Entrega e) {
        var recebido = pagamentos.somarSaldoPorEntrega(e.getId());
        var saldo = e.getValorFinal().subtract(recebido).max(BigDecimal.ZERO);
        var r = e.getEntregador();
        var motivo = pendencia(e);
        boolean regular = financeiroRegular(e, saldo);
        boolean autorizado =
            identidade.usuario().getPerfilEfetivo() == PerfilAcesso.PROPRIETARIO ||
            (identidade.usuario().getPerfilEfetivo() == PerfilAcesso.ENTREGADOR &&
                r != null &&
                r.getUsuario() != null &&
                identidade.usuario().getId().equals(r.getUsuario().getId()));
        var ultimo = recebimentosLiquidos(e)
            .stream()
            .max(Comparator.comparing(Pagamento::getPagoEm))
            .orElse(null);
        boolean pix = e.getFormaPagamento() == FormaPagamento.PIX;
        boolean configurado = r != null && (!pix || r.getChavePix() != null);
        boolean terminal = terminal(e);
        var legada = cobrancas
            .findByEntregaId(e.getId())
            .filter(c -> "PENDENTE".equals(c.getStatus()))
            .orElse(null);
        return new RecebimentoResponse(
            e.getFormaPagamento(),
            recebido,
            saldo,
            r == null ? null : r.getId(),
            r == null ? null : r.getNome(),
            pix && r != null ? r.getChavePix() : null,
            pix && r != null ? r.getTitularPix() : null,
            referencia(e),
            regular,
            autorizado &&
                configurado &&
                !terminal &&
                saldo.signum() > 0 &&
                formaDireta(e.getFormaPagamento()) &&
                !legadoPendente(e),
            e.getStatus() == StatusEntrega.EM_ROTA && motivo == null,
            terminal ? "Entrega encerrada: " + e.getStatus().name() : motivo,
            ultimo == null ? null : ultimo.getUsuarioResponsavel().getNome(),
            ultimo == null ? null : ultimo.getPagoEm(),
            legada == null ? null : legada.getId(),
            legada == null ? null : legada.getMercadoPagoId()
        );
    }

    private String pendencia(Entrega e) {
        if (e.getStatus() == StatusEntrega.CANCELADA) return "Entrega cancelada";
        if (e.getEntregador() == null) return "Designe um entregador para finalizar";
        var saldo = e.getValorFinal().subtract(pagamentos.somarSaldoPorEntrega(e.getId()));
        if (e.getValorFinal().signum() > 0) {
            if (legadoPendente(e)) return "Concilie a cobrança legada pendente";
            if (saldo.signum() > 0) return e.getFormaPagamento() == FormaPagamento.PIX
                ? "Confirme o recebimento do Pix para finalizar. Existe saldo pendente"
                : e.getFormaPagamento() == FormaPagamento.DINHEIRO
                    ? "Confirme o recebimento em dinheiro para finalizar. Existe saldo pendente"
                    : "Escolha Pix ou Dinheiro e regularize o saldo pendente";
            if (
                !financeiroRegular(e, saldo)
            ) return "Pagamento precisa ser conciliado com a forma e o recebedor atuais";
        }
        var rota = paradas.findByEntregaIdOrderByOrdem(e.getId());
        if (
            rota.isEmpty() || rota.stream().anyMatch(p -> p.getStatus() != StatusParada.CONCLUIDA)
        ) return "Conclua as paradas pendentes";
        return null;
    }

    private boolean financeiroRegular(Entrega e, BigDecimal saldo) {
        if (e.getValorFinal().signum() == 0) return true;
        if (saldo.signum() > 0 || legadoPendente(e)) return false;
        return recebimentosLiquidos(e)
            .stream()
            .filter(p -> p.getRecebedor() != null)
            .allMatch(
                p ->
                    e.getEntregador() != null &&
                    p.getRecebedor().getId().equals(e.getEntregador().getId()) &&
                    p.getFormaPagamento() == e.getFormaPagamento()
            );
    }

    private List<Pagamento> recebimentosLiquidos(Entrega e) {
        var historico = pagamentos.findByEntregaId(e.getId());
        var estornos = new HashMap<UUID, BigDecimal>();
        for (var p : historico) {
            if (
                p.getTipo() == TipoLancamentoFinanceiro.ESTORNO && p.getLancamentoOriginal() != null
            ) estornos.merge(p.getLancamentoOriginal().getId(), p.getValor(), BigDecimal::add);
        }
        return historico
            .stream()
            .filter(p -> p.getTipo() == TipoLancamentoFinanceiro.RECEBIMENTO)
            .filter(p -> p.getValor().compareTo(estornos.getOrDefault(p.getId(), BigDecimal.ZERO)) > 0)
            .toList();
    }

    private boolean legadoPendente(Entrega e) {
        return cobrancas
            .findByEntregaId(e.getId())
            .filter(c -> "PENDENTE".equals(c.getStatus()))
            .isPresent();
    }

    private boolean terminal(Entrega e) {
        return EnumSet.of(
            StatusEntrega.CANCELADA,
            StatusEntrega.ENTREGUE,
            StatusEntrega.DEVOLVIDA,
            StatusEntrega.FALHA_OPERACIONAL
        ).contains(e.getStatus());
    }

    private boolean formaDireta(FormaPagamento forma) {
        return forma == FormaPagamento.PIX || forma == FormaPagamento.DINHEIRO;
    }

    private void autorizarConfirmacao(Entrega e) {
        if (identidade.usuario().getPerfilEfetivo() == PerfilAcesso.PROPRIETARIO) return;
        if (identidade.usuario().getPerfilEfetivo() == PerfilAcesso.ENTREGADOR) {
            var r = identidade.entregadorObrigatorio();
            if (e.getEntregador() != null && r.getId().equals(e.getEntregador().getId())) return;
        }
        throw new AccessDeniedException(
            "Somente o recebedor autorizado ou o proprietário pode confirmar recebimento"
        );
    }

    private String referencia(Entrega e) {
        var r = e.getEntregador();
        var dados =
            e.getId() +
            "|" +
            e.getValorFinal() +
            "|" +
            e.getFormaPagamento() +
            "|" +
            (r == null
                    ? ""
                    : r.getId() + "|" + r.getNome() + "|" + r.getChavePix() + "|" + r.getTitularPix());
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(dados.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 indisponível", ex);
        }
    }
}
