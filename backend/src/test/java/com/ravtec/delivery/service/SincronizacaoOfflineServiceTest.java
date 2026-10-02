package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.EntregaOperacionalResponse;
import com.ravtec.delivery.dto.EntregaStatusRequest;
import com.ravtec.delivery.entity.AcaoOffline;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.repository.AcaoOfflineRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SincronizacaoOfflineServiceTest {
    private final AcaoOfflineRepository repository = mock(AcaoOfflineRepository.class);
    private final EntregaService entregaService = mock(EntregaService.class);
    private final IdentidadeAtual identidadeAtual = mock(IdentidadeAtual.class);
    private final EntregaAcessoService acessoService = mock(EntregaAcessoService.class);
    private final SincronizacaoOfflineService service = new SincronizacaoOfflineService(
        repository, entregaService, identidadeAtual, acessoService);
    private final Usuario usuario = usuario();

    @Test
    void repeticaoIdenticaConsultaEntregaAtualSemExecutarStatusDeNovo() {
        var entregaId = UUID.randomUUID();
        var request = new EntregaStatusRequest(StatusEntrega.COLETADA);
        var resposta = mock(EntregaOperacionalResponse.class);
        when(identidadeAtual.usuario()).thenReturn(usuario);
        when(repository.findByUsuarioIdAndChaveIdempotencia(usuario.getId(), "retry-1"))
            .thenReturn(Optional.of(acao(entregaId, request.status())));
        when(entregaService.consultarMinhaEntrega(entregaId)).thenReturn(resposta);
        when(resposta.status()).thenReturn(StatusEntrega.EM_ROTA);

        var atual = service.alterarStatus(entregaId, request, "retry-1");
        assertThat(atual).isSameAs(resposta);
        assertThat(atual.status()).isEqualTo(StatusEntrega.EM_ROTA);
        verify(entregaService).consultarMinhaEntrega(entregaId);
        verifyNoInteractions(acessoService);
    }

    @Test
    void mesmaChaveComOutraEntregaGeraConflito() {
        var entregaId = UUID.randomUUID();
        when(identidadeAtual.usuario()).thenReturn(usuario);
        when(repository.findByUsuarioIdAndChaveIdempotencia(usuario.getId(), "retry-2"))
            .thenReturn(Optional.of(acao(UUID.randomUUID(), StatusEntrega.COLETADA)));

        assertThatThrownBy(() -> service.alterarStatus(entregaId,
            new EntregaStatusRequest(StatusEntrega.COLETADA), "retry-2"))
            .isInstanceOf(ConflitoException.class);
        verifyNoInteractions(entregaService, acessoService);
    }

    @Test
    void mesmaChaveComOutroStatusGeraConflito() {
        var entregaId = UUID.randomUUID();
        when(identidadeAtual.usuario()).thenReturn(usuario);
        when(repository.findByUsuarioIdAndChaveIdempotencia(usuario.getId(), "retry-3"))
            .thenReturn(Optional.of(acao(entregaId, StatusEntrega.COLETADA)));

        assertThatThrownBy(() -> service.alterarStatus(entregaId,
            new EntregaStatusRequest(StatusEntrega.EM_ROTA), "retry-3"))
            .isInstanceOf(ConflitoException.class);
        verifyNoInteractions(entregaService, acessoService);
    }

    private static Usuario usuario() {
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        return usuario;
    }

    private static AcaoOffline acao(UUID entregaId, StatusEntrega status) {
        var entrega = new Entrega();
        entrega.setId(entregaId);
        var acao = new AcaoOffline();
        acao.setEntrega(entrega);
        acao.setAcao("ALTERAR_STATUS");
        acao.setResultadoStatus(status.name());
        return acao;
    }
}
