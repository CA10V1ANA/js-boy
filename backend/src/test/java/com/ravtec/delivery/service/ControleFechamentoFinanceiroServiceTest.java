package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.repository.FechamentoFinanceiroRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ControleFechamentoFinanceiroServiceTest {
    @Test
    void bloqueiaMovimentoDentroDePeriodoFechado() {
        var repository = mock(FechamentoFinanceiroRepository.class);
        var service = new ControleFechamentoFinanceiroService(repository);
        ReflectionTestUtils.setField(service, "zona", "America/Fortaleza");
        var data = LocalDate.parse("2026-08-10");
        when(repository.existsByInicioLessThanEqualAndFimGreaterThanEqualAndReabertoEmIsNull(data, data))
            .thenReturn(true);

        assertThatThrownBy(() -> service.validarAberto(OffsetDateTime.parse("2026-08-10T15:00:00Z")))
            .isInstanceOf(ConflitoException.class)
            .hasMessageContaining("fechado");
    }
}
