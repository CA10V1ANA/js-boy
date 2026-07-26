package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.EstornoRequest;
import com.ravtec.delivery.dto.PagamentoRequest;
import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.FormaPagamento;
import com.ravtec.delivery.entity.Pagamento;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.TipoLancamentoFinanceiro;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.mapper.PagamentoMapper;
import com.ravtec.delivery.repository.EntregaFinanceiraRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.repository.PagamentoRepository;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class PagamentoServiceTest {

    @Mock
    private PagamentoRepository pagamentoRepository;
    @Mock
    private EntregaRepository entregaRepository;
    @Mock
    private EntregaFinanceiraRepository entregaFinanceiraRepository;

    private PagamentoService service;
    private Entrega entrega;
    private Usuario proprietario;

    @BeforeEach
    void setUp() {
        service = new PagamentoService(
            pagamentoRepository,
            entregaRepository,
            entregaFinanceiraRepository,
            new PagamentoMapper()
        );

        proprietario = new Usuario();
        proprietario.setId(UUID.randomUUID());
        proprietario.setNome("Proprietario");
        proprietario.setEmail("owner@example.test");
        proprietario.setPerfil(PerfilAcesso.PROPRIETARIO);
        proprietario.setAtivo(true);
        var principal = new UsuarioPrincipal(proprietario);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        var cliente = new Cliente();
        cliente.setId(UUID.randomUUID());
        cliente.setNome("Cliente");
        entrega = new Entrega();
        entrega.setId(UUID.randomUUID());
        entrega.setCodigo("JSB-TEST");
        entrega.setCliente(cliente);
        entrega.setValorFinal(new BigDecimal("100.00"));

        when(entregaFinanceiraRepository.buscarParaAtualizacao(entrega.getId()))
            .thenReturn(Optional.of(entrega));
        lenient().when(pagamentoRepository.saveAndFlush(any(Pagamento.class))).thenAnswer(invocation -> {
            var pagamento = invocation.getArgument(0, Pagamento.class);
            pagamento.setId(UUID.randomUUID());
            return pagamento;
        });
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deveRegistrarPagamentoParcial() {
        when(pagamentoRepository.somarSaldoPorEntrega(entrega.getId()))
            .thenReturn(new BigDecimal("20.00"));

        var response = service.registrar("pay-partial-001", request("30.00"));

        assertThat(response.valor()).isEqualByComparingTo("30.00");
        assertThat(response.tipo()).isEqualTo(TipoLancamentoFinanceiro.RECEBIMENTO);
    }

    @Test
    void devePermitirPagamentoExatoDoSaldo() {
        when(pagamentoRepository.somarSaldoPorEntrega(entrega.getId()))
            .thenReturn(new BigDecimal("20.00"));

        var response = service.registrar("pay-exact-001", request("80.00"));

        assertThat(response.valor()).isEqualByComparingTo("80.00");
    }

    @Test
    void deveRejeitarSobrepagamento() {
        when(pagamentoRepository.somarSaldoPorEntrega(entrega.getId()))
            .thenReturn(new BigDecimal("80.00"));

        assertThatThrownBy(() -> service.registrar("pay-over-0001", request("30.00")))
            .isInstanceOf(ConflitoException.class)
            .hasMessageContaining("saldo");
        verify(pagamentoRepository, never()).saveAndFlush(any());
    }

    @Test
    void deveRetornarMesmoLancamentoParaChaveEPayloadIguais() {
        when(pagamentoRepository.somarSaldoPorEntrega(entrega.getId()))
            .thenReturn(BigDecimal.ZERO);
        var primeira = service.registrar("pay-retry-001", request("25.00"));
        var captor = ArgumentCaptor.forClass(Pagamento.class);
        verify(pagamentoRepository).saveAndFlush(captor.capture());
        when(pagamentoRepository.findByIdempotencyKey("pay-retry-001"))
            .thenReturn(Optional.of(captor.getValue()));

        var repetida = service.registrar("pay-retry-001", request("25.00"));

        assertThat(repetida.id()).isEqualTo(primeira.id());
    }

    @Test
    void deveRejeitarChaveReutilizadaComPayloadDiferente() {
        var existente = recebimento("25.00");
        existente.setIdempotencyKey("pay-conflict-1");
        existente.setPayloadHash("hash-diferente");
        when(pagamentoRepository.findByIdempotencyKey("pay-conflict-1"))
            .thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> service.registrar("pay-conflict-1", request("25.00")))
            .isInstanceOf(ConflitoException.class)
            .hasMessageContaining("dados diferentes");
    }

    @Test
    void deveRegistrarEstornoParcialERejeitarAcimaDoDisponivel() {
        var original = recebimento("80.00");
        original.setId(UUID.randomUUID());
        when(pagamentoRepository.findById(original.getId())).thenReturn(Optional.of(original));
        when(pagamentoRepository.somarEstornosDoLancamento(original.getId()))
            .thenReturn(new BigDecimal("20.00"));

        var response = service.estornar(
            original.getId(),
            "refund-0000001",
            new EstornoRequest(new BigDecimal("30.00"), "Ajuste solicitado")
        );
        assertThat(response.tipo()).isEqualTo(TipoLancamentoFinanceiro.ESTORNO);
        assertThat(response.lancamentoOriginalId()).isEqualTo(original.getId());

        assertThatThrownBy(() -> service.estornar(
            original.getId(),
            "refund-0000002",
            new EstornoRequest(new BigDecimal("70.00"), "Valor indevido")
        )).isInstanceOf(ConflitoException.class);
    }

    private PagamentoRequest request(String valor) {
        return new PagamentoRequest(
            entrega.getId(),
            new BigDecimal(valor),
            FormaPagamento.PIX,
            null,
            null,
            "Teste"
        );
    }

    private Pagamento recebimento(String valor) {
        var pagamento = new Pagamento();
        pagamento.setId(UUID.randomUUID());
        pagamento.setEntrega(entrega);
        pagamento.setValor(new BigDecimal(valor));
        pagamento.setFormaPagamento(FormaPagamento.PIX);
        pagamento.setTipo(TipoLancamentoFinanceiro.RECEBIMENTO);
        pagamento.setUsuarioResponsavel(proprietario);
        pagamento.setIdempotencyKey("existing-key");
        pagamento.setPayloadHash("existing-hash");
        return pagamento;
    }
}
