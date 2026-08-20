package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.DesafioComprovanteEntrega;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.ParadaEntrega;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.entity.StatusParada;
import com.ravtec.delivery.entity.TipoParada;
import com.ravtec.delivery.repository.DesafioComprovanteEntregaRepository;
import com.ravtec.delivery.repository.ParadaEntregaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

class DesafioComprovanteServiceTest {
    private final DesafioComprovanteEntregaRepository repository = mock(DesafioComprovanteEntregaRepository.class);
    private final ParadaEntregaRepository paradas = mock(ParadaEntregaRepository.class);
    private final EntregaAcessoService acesso = mock(EntregaAcessoService.class);
    private final TokenSeguroService tokens = mock(TokenSeguroService.class);
    private final NotificadorOtpComprovante notificador = mock(NotificadorOtpComprovante.class);
    private final DesafioComprovanteService service =
        new DesafioComprovanteService(repository, paradas, acesso, tokens, notificador);
    private final AtomicReference<DesafioComprovanteEntrega> salvo = new AtomicReference<>();
    private final AtomicReference<String> codigoEnviado = new AtomicReference<>();
    private Entrega entrega;
    private ParadaEntrega parada;

    @BeforeEach
    void preparar() {
        ReflectionTestUtils.setField(service, "minutosExpiracao", 10L);
        ReflectionTestUtils.setField(service, "segundosReenvio", 60L);
        ReflectionTestUtils.setField(service, "maxTentativas", 5);
        entrega = new Entrega(); entrega.setId(UUID.randomUUID()); entrega.setStatus(StatusEntrega.EM_ROTA);
        entrega.setDestinatarioTelefone("85999998888");
        parada = new ParadaEntrega(); parada.setId(UUID.randomUUID()); parada.setEntrega(entrega);
        parada.setTipo(TipoParada.ENTREGA); parada.setOrdem(2); parada.setStatus(StatusParada.PENDENTE);
        parada.setContatoTelefone("85999998888");
        when(acesso.exigirDoEntregadorParaAtualizacao(entrega.getId())).thenReturn(entrega);
        when(paradas.findByEntregaIdOrderByOrdem(entrega.getId())).thenReturn(List.of(parada));
        when(repository.findByEntregaIdParaAtualizacao(entrega.getId()))
            .thenAnswer(invocation -> Optional.ofNullable(salvo.get()));
        when(repository.save(any())).thenAnswer(invocation -> {
            var item = invocation.getArgument(0, DesafioComprovanteEntrega.class);
            item.setId(UUID.randomUUID()); salvo.set(item); return item;
        });
        when(tokens.hash(any())).thenAnswer(invocation -> "hash:" + invocation.getArgument(0, String.class));
        org.mockito.Mockito.doAnswer(invocation -> {
            codigoEnviado.set(invocation.getArgument(1, String.class)); return null;
        }).when(notificador).enviar(any(), any(), any());
    }

    @Test
    void emiteCodigoSemExpoLoEConsomeNaParadaFinal() {
        var response = service.solicitar(entrega.getId());

        assertThat(response.destinoMascarado()).endsWith("8888");
        assertThat(codigoEnviado.get()).matches("\\d{6}");

        var confirmacao = service.consumir(entrega, parada.getId(), codigoEnviado.get());
        assertThat(confirmacao.parada().getStatus()).isEqualTo(StatusParada.CONCLUIDA);
        assertThat(confirmacao.desafio().getConsumidoEm()).isNotNull();
    }

    @Test
    void rejeitaCodigoNaoEmitidoERegistraTentativa() {
        service.solicitar(entrega.getId());

        assertThatThrownBy(() -> service.consumir(entrega, parada.getId(), "000000"))
            .isInstanceOf(BadCredentialsException.class);
        assertThat(salvo.get().getTentativas()).isEqualTo(1);
        assertThat(parada.getStatus()).isEqualTo(StatusParada.PENDENTE);
    }
}
