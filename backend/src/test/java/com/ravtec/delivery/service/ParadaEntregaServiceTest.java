package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.dto.ParadaRequest;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.ParadaEntregaRepository;
import java.util.*;
import org.junit.jupiter.api.Test;

class ParadaEntregaServiceTest {
    @Test
    void rejeitaOrdemComLacuna() {
        var repository = mock(ParadaEntregaRepository.class);
        var service = new ParadaEntregaService(repository, mock(EntregaAcessoService.class),
            new NormalizacaoService(), mock(AuditoriaService.class));
        var entrega = new Entrega();
        entrega.setId(UUID.randomUUID());
        when(repository.findByEntregaIdOrderByOrdem(entrega.getId())).thenReturn(List.of());
        var requests = List.of(
            parada(1, TipoParada.COLETA),
            parada(3, TipoParada.ENTREGA)
        );

        assertThatThrownBy(() -> service.substituir(entrega, requests))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("continua");
    }

    private ParadaRequest parada(int ordem, TipoParada tipo) {
        return new ParadaRequest(ordem, tipo, "Rua A", "1", false, null,
            "Centro", "Fortaleza", "CE", "60000000", null, null, null, null);
    }
}
