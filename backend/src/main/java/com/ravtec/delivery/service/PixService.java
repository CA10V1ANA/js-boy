package com.ravtec.delivery.service;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.resources.payment.Payment;
import com.ravtec.delivery.dto.PixResponse;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class PixService {
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    private final PaymentClient client;
    private final CobrancaPixRepository cobrancas;
    private final EntregaFinanceiraRepository entregas;
    private final PagamentoRepository pagamentos;
    private final TransactionTemplate tx;
    private final ControleFechamentoFinanceiroService fechamento;
    private final String token;

    public PixService(PaymentClient client, CobrancaPixRepository cobrancas,
        EntregaFinanceiraRepository entregas, PagamentoRepository pagamentos,
        TransactionTemplate tx, ControleFechamentoFinanceiroService fechamento,
        @Value("${app.mercadopago.access-token:}") String token) {
        this.client = client; this.cobrancas = cobrancas; this.entregas = entregas;
        this.pagamentos = pagamentos; this.tx = tx; this.fechamento = fechamento;
        this.token = token;
    }

    public PixResponse consultar(UUID id) {
        return tx.execute(s -> {
            var c = cobrancas.findById(id).orElseThrow(() -> new IllegalArgumentException("Cobrança não encontrada"));
            autorizar(c.getEntrega());
            return PixResponse.of(c);
        });
    }

    /** Read an existing provider transaction; never issues a new charge. */
    public PixResponse conciliar(UUID id, Long transacaoId) {
        if (principal().getUsuario().getPerfilEfetivo() != PerfilAcesso.PROPRIETARIO)
            throw new AccessDeniedException("Somente o proprietário concilia cobranças legadas");
        if (token.isBlank()) throw new IllegalStateException("Configure a credencial de conciliação legada do Mercado Pago");
        var c = cobrancas.findById(id).orElseThrow(() -> new IllegalArgumentException("Cobrança não encontrada"));
        if (c.getMercadoPagoId() != null && !c.getMercadoPagoId().equals(transacaoId))
            throw new IllegalArgumentException("Transação divergente da cobrança legada");
        Payment payment;
        try { payment = client.get(transacaoId, MPRequestOptions.builder().accessToken(token).build()); }
        catch (Exception ex) { throw new IllegalStateException("Não foi possível consultar a transação legada no provedor", ex); }
        if (!transacaoId.equals(payment.getId())) throw new IllegalArgumentException("Transação divergente");
        return atualizar(id, payment);
    }

    public void notificar(Long mpId) {
        Payment payment;
        try { payment = client.get(mpId, MPRequestOptions.builder().accessToken(token).build()); }
        catch (Exception e) { throw new RuntimeException("Falha ao consultar pagamento no provedor; webhook deve ser reenviado"); }
        if (!Objects.equals(mpId, payment.getId())) throw new IllegalArgumentException("Transação divergente");
        UUID id;
        try { id = UUID.fromString(payment.getExternalReference()); }
        catch (Exception e) { return; } // Payment from another integration on the same account.
        if (cobrancas.existsById(id)) atualizar(id, payment);
    }

    PixResponse atualizar(UUID id, Payment p) {
        return tx.execute(s -> {
            var inicial = cobrancas.findById(id).orElseThrow();
            entregas.buscarParaAtualizacao(inicial.getEntrega().getId()).orElseThrow();
            // Refresh after obtaining the delivery lock (another webhook may have committed).
            entityManager.refresh(inicial);
            var c = inicial;
            if (!id.toString().equals(p.getExternalReference()) || !"pix".equals(p.getPaymentMethodId())
                || !"BRL".equals(p.getCurrencyId()) || p.getTransactionAmount() == null
                || c.getValor().compareTo(p.getTransactionAmount()) != 0 || p.getId() == null
                || (c.getMercadoPagoId() != null && !c.getMercadoPagoId().equals(p.getId())))
                throw new IllegalArgumentException("Dados da transação não correspondem à cobrança");
            c.setMercadoPagoId(p.getId());
            if (p.getPointOfInteraction() != null && p.getPointOfInteraction().getTransactionData() != null) {
                var data = p.getPointOfInteraction().getTransactionData();
                c.setQrCodeBase64(data.getQrCodeBase64()); c.setQrCodeCopiaECola(data.getQrCode());
            }
            if ("approved".equals(p.getStatus()) && c.getPagamento() == null) {
                var quando = p.getDateApproved();
                if (quando == null) throw new IllegalArgumentException("Aprovação sem data");
                fechamento.validarAberto(quando);
                var lancamento = new Pagamento();
                lancamento.setEntrega(c.getEntrega()); lancamento.setValor(c.getValor());
                lancamento.setFormaPagamento(FormaPagamento.PIX); lancamento.setPagoEm(quando);
                lancamento.setUsuarioResponsavel(c.getSolicitante());
                lancamento.setIdempotencyKey("mp-pix:" + c.getId());
                lancamento.setPayloadHash(c.getId().toString());
                lancamento.setComprovante("Mercado Pago " + p.getId());
                c.setPagamento(pagamentos.saveAndFlush(lancamento));
            }
            if (c.getPagamento() != null) c.setStatus("PAGO");
            else c.setStatus(switch (Objects.toString(p.getStatus(), "")) {
                case "rejected" -> "REJEITADO";
                case "cancelled" -> "CANCELADO";
                default -> "PENDENTE";
            });
            return PixResponse.of(cobrancas.saveAndFlush(c));
        });
    }

    private UsuarioPrincipal principal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UsuarioPrincipal p))
            throw new AccessDeniedException("Autenticação obrigatória");
        return p;
    }

    private void autorizar(Entrega e) {
        var p = principal();
        var perfil = p.getUsuario().getPerfilEfetivo();
        if (perfil == PerfilAcesso.PROPRIETARIO) return;
        if (perfil == PerfilAcesso.CLIENTE && e.getCliente().getUsuario() != null
            && p.getId().equals(e.getCliente().getUsuario().getId())) return;
        if (perfil == PerfilAcesso.ENTREGADOR && e.getEntregador() != null
            && e.getEntregador().getUsuario() != null
            && p.getId().equals(e.getEntregador().getUsuario().getId())) return;
        throw new AccessDeniedException("Entrega não pertence ao usuário");
    }
}
