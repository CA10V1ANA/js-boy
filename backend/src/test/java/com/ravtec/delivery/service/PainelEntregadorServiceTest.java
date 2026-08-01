package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.Entregador;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.entity.TipoComprovante;
import com.ravtec.delivery.repository.ComprovanteEntregaRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PainelEntregadorServiceTest {
    @Mock
    private EntregaRepository entregaRepository;
    @Mock
    private ComprovanteEntregaRepository comprovanteRepository;
    @Mock
    private IdentidadeAtual identidadeAtual;

    private PainelEntregadorService service;
    private UUID usuarioId;

    @BeforeEach
    void setUp() {
        service = new PainelEntregadorService(entregaRepository, comprovanteRepository, identidadeAtual);
        usuarioId = UUID.randomUUID();
        var principal = mock(UsuarioPrincipal.class);
        when(principal.getId()).thenReturn(usuarioId);
        when(identidadeAtual.principal()).thenReturn(principal);
        when(identidadeAtual.entregadorObrigatorio()).thenReturn(mock(Entregador.class));
    }

    @Test
    void deveResumirOperacaoDoEntregadorNoDia() {
        var emRota = entrega(StatusEntrega.EM_ROTA, "42.50", null);
        var concluidaHoje = entrega(StatusEntrega.ENTREGUE, "58.00",
            OffsetDateTime.now(ZoneOffset.ofHours(-3)));
        var antiga = entrega(StatusEntrega.ENTREGUE, "99.00",
            OffsetDateTime.now(ZoneOffset.ofHours(-3)).minusDays(1));
        when(entregaRepository.findByEntregadorUsuarioIdOrderByCriadoEmDesc(usuarioId))
            .thenReturn(List.of(emRota, concluidaHoje, antiga));
        when(comprovanteRepository.existsByEntregaIdAndTipoAndSubstituidoPorIsNull(
            emRota.getId(), TipoComprovante.ENTREGA)).thenReturn(false);

        var resumo = service.resumoHoje();

        assertThat(resumo.entregasAtivas()).isEqualTo(1);
        assertThat(resumo.emRota()).isEqualTo(1);
        assertThat(resumo.concluidasHoje()).isEqualTo(1);
        assertThat(resumo.valorMovimentadoHoje()).isEqualByComparingTo("58.00");
        assertThat(resumo.documentacaoPendente()).isEqualTo(1);
    }

    private Entrega entrega(StatusEntrega status, String valor, OffsetDateTime concluidaEm) {
        var entrega = new Entrega();
        entrega.setId(UUID.randomUUID());
        entrega.setStatus(status);
        entrega.setValorFinal(new BigDecimal(valor));
        entrega.setConcluidaEm(concluidaEm);
        return entrega;
    }
}
