package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.repository.ClienteRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.repository.EntregadorRepository;
import com.ravtec.delivery.repository.FechamentoFinanceiroRepository;
import com.ravtec.delivery.repository.LancamentoRazaoRepository;
import com.ravtec.delivery.repository.PagamentoRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class RazaoFinanceiraRelatorioTest {
    @Test
    void usaSomenteEntregasConcluidasNoPeriodoESeparaCompetenciaDeCaixa() {
        var entregaRepository = mock(EntregaRepository.class);
        var pagamentoRepository = mock(PagamentoRepository.class);
        var razaoRepository = mock(LancamentoRazaoRepository.class);
        var service = new RazaoFinanceiraService(
            razaoRepository, mock(FechamentoFinanceiroRepository.class), mock(ClienteRepository.class),
            mock(EntregadorRepository.class), entregaRepository, pagamentoRepository,
            mock(IdentidadeAtual.class), new TokenSeguroService(), mock(AuditoriaService.class)
        );
        ReflectionTestUtils.setField(service, "zona", "America/Fortaleza");

        var cliente = new Cliente();
        cliente.setId(UUID.randomUUID());
        cliente.setNome("Cliente fixo");
        var entrega = new Entrega();
        entrega.setId(UUID.randomUUID());
        entrega.setCodigo("ENT-001");
        entrega.setCliente(cliente);
        entrega.setStatus(StatusEntrega.ENTREGUE);
        entrega.setConcluidaEm(OffsetDateTime.parse("2026-08-10T12:00:00-03:00"));
        entrega.setValorFinal(new BigDecimal("100.00"));

        when(entregaRepository
            .findByStatusAndConcluidaEmGreaterThanEqualAndConcluidaEmLessThanOrderByConcluidaEmAsc(
                any(), any(), any()
            )).thenReturn(List.of(entrega));
        when(pagamentoRepository.findByPagoEmGreaterThanEqualAndPagoEmLessThanOrderByPagoEmAsc(any(), any()))
            .thenReturn(List.of());
        when(pagamentoRepository.somarSaldoPorEntregas(List.of(entrega.getId())))
            .thenReturn(new BigDecimal("40.00"));
        when(razaoRepository.findByCompetenciaBetweenOrderByOcorridoEm(any(), any())).thenReturn(List.of());

        var response = service.relatorio(LocalDate.parse("2026-08-01"), LocalDate.parse("2026-08-31"));

        assertThat(response.faturado()).isEqualByComparingTo("100.00");
        assertThat(response.recebido()).isZero();
        assertThat(response.recebidoDoFaturamento()).isEqualByComparingTo("40.00");
        assertThat(response.pendente()).isEqualByComparingTo("60.00");
        assertThat(response.entregasFaturadas()).isEqualTo(1);
        assertThat(response.faturamentoPorCliente()).singleElement()
            .satisfies(item -> assertThat(item.nome()).isEqualTo("Cliente fixo"));
        verify(entregaRepository, never()).findAll();
        verify(pagamentoRepository, never()).findAll();
    }
}
