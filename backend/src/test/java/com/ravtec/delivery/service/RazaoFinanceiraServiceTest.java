package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.dto.LancamentoRazaoRequest;
import com.ravtec.delivery.entity.TipoLancamentoRazao;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class RazaoFinanceiraServiceTest {
    @Test
    void bloqueiaCaixaFechadoMesmoComCompetenciaAberta() {
        var fechamentos = mock(FechamentoFinanceiroRepository.class);
        var razao = mock(LancamentoRazaoRepository.class);
        var service = new RazaoFinanceiraService(razao, fechamentos, mock(ClienteRepository.class),
            mock(EntregadorRepository.class), mock(EntregaRepository.class), mock(PagamentoRepository.class),
            mock(IdentidadeAtual.class), new TokenSeguroService(), mock(AuditoriaService.class),
            mock(CoordenacaoFinanceiraService.class));
        ReflectionTestUtils.setField(service, "zona", "America/Fortaleza");
        var caixa = LocalDate.of(2026, 8, 31);
        when(fechamentos.existsByInicioLessThanEqualAndFimGreaterThanEqualAndReabertoEmIsNull(caixa, caixa))
            .thenReturn(true);
        // UTC September 1 is still August 31 in the business timezone.
        var request = new LancamentoRazaoRequest(TipoLancamentoRazao.DESPESA, "Combustivel",
            BigDecimal.TEN, LocalDate.of(2026, 9, 1),
            java.time.OffsetDateTime.parse("2026-09-01T01:00:00Z"), null, null, null, null, null);
        assertThatThrownBy(() -> service.registrar("despesa:caixa", request))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("fechado");
        verify(razao, never()).save(any());
    }

    @Test
    void impedeFechamentoSobreposto() {
        var fechamentos = mock(FechamentoFinanceiroRepository.class);
        var service = new RazaoFinanceiraService(mock(LancamentoRazaoRepository.class), fechamentos,
            mock(ClienteRepository.class), mock(EntregadorRepository.class), mock(EntregaRepository.class),
            mock(PagamentoRepository.class), mock(IdentidadeAtual.class), new TokenSeguroService(),
            mock(AuditoriaService.class), mock(CoordenacaoFinanceiraService.class));
        var inicio = LocalDate.of(2026, 8, 1);
        var fim = LocalDate.of(2026, 8, 31);
        when(fechamentos.existsByInicioLessThanEqualAndFimGreaterThanEqualAndReabertoEmIsNull(fim, inicio))
            .thenReturn(true);
        assertThatThrownBy(() -> service.fechar(inicio, fim))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("sobreposto");
        verify(fechamentos, never()).save(any());
    }

    @Test
    void bloqueiaLancamentoEmPeriodoFechado() {
        var fechamentos = mock(FechamentoFinanceiroRepository.class);
        var service = new RazaoFinanceiraService(
            mock(LancamentoRazaoRepository.class), fechamentos, mock(ClienteRepository.class),
            mock(EntregadorRepository.class), mock(EntregaRepository.class), mock(PagamentoRepository.class),
            mock(IdentidadeAtual.class), new TokenSeguroService(), mock(AuditoriaService.class), mock(CoordenacaoFinanceiraService.class));
        ReflectionTestUtils.setField(service, "zona", "America/Fortaleza");
        var data = LocalDate.now();
        when(fechamentos.existsByInicioLessThanEqualAndFimGreaterThanEqualAndReabertoEmIsNull(data, data))
            .thenReturn(true);
        var request = new LancamentoRazaoRequest(TipoLancamentoRazao.DESPESA, "Combustivel",
            BigDecimal.TEN, data, null, null, null, null, null, null);
        assertThatThrownBy(() -> service.registrar("despesa:123", request))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("fechado");
    }
}
