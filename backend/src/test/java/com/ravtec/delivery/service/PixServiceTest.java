package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.UsuarioPrincipal;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

class PixServiceTest {
    PaymentClient client;
    CobrancaPixRepository cobrancas;
    EntregaFinanceiraRepository entregas;
    PagamentoRepository pagamentos;
    PixService service;
    CobrancaPix c;
    Usuario user;
    Entrega entrega;

    @BeforeEach void setup() {
        client = mock(PaymentClient.class); cobrancas = mock(CobrancaPixRepository.class);
        entregas = mock(EntregaFinanceiraRepository.class); pagamentos = mock(PagamentoRepository.class);
        service = new PixService(client, cobrancas, entregas, pagamentos,
            new TransactionTemplate(mock(PlatformTransactionManager.class)),
            mock(ControleFechamentoFinanceiroService.class), "fake-token", "https://example.invalid/webhook", "secret");
        ReflectionTestUtils.setField(service, "entityManager", mock(EntityManager.class));
        user = new Usuario(); user.setId(UUID.randomUUID()); user.setPerfil(PerfilAcesso.PROPRIETARIO);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            new UsuarioPrincipal(user), null));
        var cliente = new Cliente(); cliente.setEmail("payer@example.invalid");
        entrega = new Entrega(); entrega.setId(UUID.randomUUID()); entrega.setCliente(cliente);
        entrega.setValorFinal(new BigDecimal("50.00"));
        c = new CobrancaPix(); c.setId(UUID.randomUUID()); c.setEntrega(entrega); c.setSolicitante(user);
        c.setValor(new BigDecimal("50.00"));
        when(entregas.buscarParaAtualizacao(entrega.getId())).thenReturn(Optional.of(entrega));
        when(cobrancas.findById(c.getId())).thenReturn(Optional.of(c));
        when(cobrancas.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        when(pagamentos.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    Payment payment(String status) {
        var p = mock(Payment.class);
        when(p.getId()).thenReturn(123L); when(p.getExternalReference()).thenReturn(c.getId().toString());
        when(p.getPaymentMethodId()).thenReturn("pix"); when(p.getCurrencyId()).thenReturn("BRL");
        when(p.getTransactionAmount()).thenReturn(c.getValor()); when(p.getStatus()).thenReturn(status);
        when(p.getDateApproved()).thenReturn(OffsetDateTime.now());
        return p;
    }
    @Test void aprovadoRepetidoGeraUmLancamento() {
        var p = payment("approved");
        assertThat(service.atualizar(c.getId(), p).status()).isEqualTo("PAGO");
        service.atualizar(c.getId(), p);
        verify(pagamentos, times(1)).saveAndFlush(any());
        assertThat(c.getPagamento().getFormaPagamento()).isEqualTo(FormaPagamento.PIX);
    }
    @Test void pendenteNaoEntraNoFinanceiro() {
        service.atualizar(c.getId(), payment("pending"));
        verify(pagamentos, never()).saveAndFlush(any());
    }
    @Test void valorDivergenteNaoBaixa() {
        var p = payment("approved"); when(p.getTransactionAmount()).thenReturn(BigDecimal.ONE);
        assertThatThrownBy(() -> service.atualizar(c.getId(), p)).isInstanceOf(IllegalArgumentException.class);
        verify(pagamentos, never()).saveAndFlush(any());
    }
    @Test void transacaoDiferenteNaoSubstituiOriginal() {
        c.setMercadoPagoId(999L);
        assertThatThrownBy(() -> service.atualizar(c.getId(), payment("approved")))
            .isInstanceOf(IllegalArgumentException.class);
    }
    @Test void clienteNaoPodeGerarPixDeOutroCliente() {
        user.setPerfil(PerfilAcesso.CLIENTE);
        assertThatThrownBy(() -> service.gerar(entrega.getId())).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(client);
    }
    @Test void cobrancaExistenteNaoChamaProvedorNovamente() {
        c.setMercadoPagoId(123L);
        when(cobrancas.findByEntregaId(entrega.getId())).thenReturn(Optional.of(c));
        assertThat(service.gerar(entrega.getId()).mercadoPagoId()).isEqualTo(123L);
        verifyNoInteractions(client);
    }
    @Test void respostaPerdidaReutilizaMesmaChaveNoProvedor() throws Exception {
        c.setEmailPagador("payer@example.invalid"); c.setExpiraEm(OffsetDateTime.now().plusMinutes(30));
        when(cobrancas.findByEntregaId(entrega.getId())).thenReturn(Optional.of(c));
        var resposta = payment("pending");
        when(client.create(any(), any())).thenThrow(new RuntimeException("resposta perdida"))
            .thenReturn(resposta);
        assertThatThrownBy(() -> service.gerar(entrega.getId())).isInstanceOf(IllegalStateException.class);
        service.gerar(entrega.getId());
        var options = org.mockito.ArgumentCaptor.forClass(com.mercadopago.core.MPRequestOptions.class);
        var requests = org.mockito.ArgumentCaptor.forClass(com.mercadopago.client.payment.PaymentCreateRequest.class);
        verify(client, times(2)).create(requests.capture(), options.capture());
        assertThat(options.getAllValues()).allSatisfy(o ->
            assertThat(o.getCustomHeaders().get("X-Idempotency-Key")).isEqualTo(c.getId().toString()));
        assertThat(requests.getAllValues()).allSatisfy(r -> {
            assertThat(r.getTransactionAmount()).isEqualByComparingTo("50.00");
            assertThat(r.getExternalReference()).isEqualTo(c.getId().toString());
        });
    }
    @Test void notificacaoConsultaTransacaoEmVezDeConfiarNoCorpo() throws Exception {
        var resposta = payment("approved");
        when(client.get(eq(123L), any())).thenReturn(resposta);
        when(cobrancas.existsById(c.getId())).thenReturn(true);
        service.notificar(123L);
        verify(client).get(eq(123L), any());
        assertThat(c.getStatus()).isEqualTo("PAGO");
    }
}
