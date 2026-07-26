package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.mapper.EntregaMapper;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class ClientePortalServiceTest {

    @Mock
    private IdentidadeAtual identidadeAtual;
    @Mock
    private EntregaRepository entregaRepository;

    private ClientePortalService clientePortalService;
    private UsuarioPrincipal principal;
    private Cliente cliente;

    @BeforeEach
    void setUp() {
        clientePortalService = new ClientePortalService(
            identidadeAtual,
            entregaRepository,
            new ClienteMapper(),
            new EntregaMapper()
        );
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setPerfil(PerfilAcesso.CLIENTE);
        usuario.setAtivo(true);
        principal = new UsuarioPrincipal(usuario);

        cliente = new Cliente();
        cliente.setId(UUID.randomUUID());
        cliente.setNome("Cliente Teste");
        cliente.setAtivo(true);
    }

    @Test
    void deveNegarClienteSemVinculo() {
        when(identidadeAtual.clienteObrigatorio())
            .thenThrow(new AccessDeniedException("Usuario cliente sem vinculo ativo"));

        assertThatThrownBy(clientePortalService::meuCadastro)
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deveListarEntregasSomentePeloUsuarioAutenticado() {
        when(identidadeAtual.clienteObrigatorio()).thenReturn(cliente);
        when(identidadeAtual.principal()).thenReturn(principal);
        when(entregaRepository.findByClienteUsuarioIdOrderByCriadoEmDesc(principal.getId()))
            .thenReturn(List.of());

        assertThat(clientePortalService.minhasEntregas()).isEmpty();
        verify(entregaRepository).findByClienteUsuarioIdOrderByCriadoEmDesc(principal.getId());
    }

    @Test
    void deveOcultarEntregaDeOutroClienteComoNaoEncontrada() {
        var entregaId = UUID.randomUUID();
        when(identidadeAtual.clienteObrigatorio()).thenReturn(cliente);
        when(identidadeAtual.principal()).thenReturn(principal);
        when(entregaRepository.findByIdAndClienteUsuarioId(entregaId, principal.getId()))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientePortalService.minhaEntrega(entregaId))
            .isInstanceOf(RecursoNaoEncontradoException.class)
            .hasMessage("Entrega nao encontrada");
    }
}
