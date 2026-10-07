package com.ravtec.delivery.service;

import com.mercadopago.client.payment.*;
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
    private final String notificationUrl;
    private final String secret;

    public PixService(PaymentClient client, CobrancaPixRepository cobrancas,
        EntregaFinanceiraRepository entregas, PagamentoRepository pagamentos,
        TransactionTemplate tx, ControleFechamentoFinanceiroService fechamento,
        @Value("${app.mercadopago.access-token:}") String token,
        @Value("${app.mercadopago.notification-url:}") String notificationUrl,
        @Value("${app.mercadopago.webhook-secret:}") String secret) {
        this.client = client; this.cobrancas = cobrancas; this.entregas = entregas;
        this.pagamentos = pagamentos; this.tx = tx; this.fechamento = fechamento;
        this.token = token; this.notificationUrl = notificationUrl; this.secret = secret;
    }

    public PixResponse gerar(UUID entregaId) {
        if (token.isBlank() || secret.isBlank() || !notificationUrl.startsWith("https://"))
            throw new IllegalStateException("Configure token, segredo e URL HTTPS do Mercado Pago no backend");
        // Persist the intent before the external call. A lost response retries the same remote key.
        var c = tx.execute(s -> {
            var entrega = entregas.buscarParaAtualizacao(entregaId).orElseThrow(
                () -> new IllegalArgumentException("Entrega não encontrada"));
            autorizar(entrega);
            var existente = cobrancas.findByEntregaId(entregaId).orElse(null);
            if (existente != null) return existente;
            if (entrega.getStatus() == StatusEntrega.CANCELADA)
                throw new IllegalStateException("Entrega cancelada");
            var saldo = entrega.getValorFinal().subtract(pagamentos.somarSaldoPorEntrega(entregaId));
            if (saldo.signum() <= 0) throw new IllegalStateException("Entrega sem saldo a pagar");
            var email = entrega.getCliente().getEmail();
            if (email == null || email.isBlank()) throw new IllegalStateException("Cadastre o e-mail do cliente");
            var nova = new CobrancaPix();
            nova.setEntrega(entrega); nova.setSolicitante(principal().getUsuario());
            nova.setValor(saldo); nova.setEmailPagador(email.trim());
            nova.setExpiraEm(OffsetDateTime.now().plusMinutes(30));
            return cobrancas.saveAndFlush(nova);
        });
        if (c.getMercadoPagoId() != null) return PixResponse.of(c);
        var request = PaymentCreateRequest.builder().transactionAmount(c.getValor())
            .paymentMethodId("pix").description("Entrega JS Boy")
            .externalReference(c.getId().toString()).notificationUrl(notificationUrl)
            .dateOfExpiration(c.getExpiraEm())
            .payer(PaymentPayerRequest.builder().email(c.getEmailPagador()).build()).build();
        Payment payment;
        try {
            payment = client.create(request, MPRequestOptions.builder()
                .accessToken(token).customHeaders(Map.of("X-Idempotency-Key", c.getId().toString())).build());
        } catch (Exception e) {
            // Do not log provider payloads, credentials or payer data.
            throw new IllegalStateException("Não foi possível gerar o Pix. Tente novamente para recuperar a mesma cobrança");
        }
        return atualizar(c.getId(), payment);
    }

    public PixResponse consultar(UUID id) {
        return tx.execute(s -> {
            var c = cobrancas.findById(id).orElseThrow(() -> new IllegalArgumentException("Cobrança não encontrada"));
            autorizar(c.getEntrega());
            return PixResponse.of(c);
        });
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
