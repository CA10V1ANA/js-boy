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
    void bloqueiaLancamentoEmPeriodoFechado() {
        var fechamentos = mock(FechamentoFinanceiroRepository.class);
        var service = new RazaoFinanceiraService(
            mock(LancamentoRazaoRepository.class), fechamentos, mock(ClienteRepository.class),
            mock(EntregadorRepository.class), mock(EntregaRepository.class), mock(PagamentoRepository.class),
            mock(IdentidadeAtual.class), new TokenSeguroService(), mock(AuditoriaService.class));
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
