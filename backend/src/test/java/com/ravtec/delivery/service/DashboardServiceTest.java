package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.repository.*;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {
    @Mock EntregaRepository entregas;
    @Mock ClienteRepository clientes;
    @Mock EntregadorRepository entregadores;
    @InjectMocks DashboardService service;

    @Test void estadosTerminaisNaoSaoContadosComoEmAndamento() {
        when(entregas.count()).thenReturn(12L);
        when(entregas.countByStatus(StatusEntrega.SOLICITADA)).thenReturn(2L);
        when(entregas.countByStatus(StatusEntrega.ENTREGUE)).thenReturn(3L);
        when(entregas.countByStatus(StatusEntrega.CANCELADA)).thenReturn(1L);
        when(entregas.countByStatus(StatusEntrega.DEVOLVIDA)).thenReturn(2L);
        when(entregas.countByStatus(StatusEntrega.FALHA_OPERACIONAL)).thenReturn(1L);
        when(entregas.somarValorTotal()).thenReturn(BigDecimal.ZERO);
        assertThat(service.resumo().emAndamento()).isEqualTo(3L);
    }
}
