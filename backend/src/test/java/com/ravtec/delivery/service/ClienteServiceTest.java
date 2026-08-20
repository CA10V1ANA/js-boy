package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.entity.Entregador;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.repository.ClienteRepository;
import com.ravtec.delivery.repository.UsuarioRepository;
import com.ravtec.delivery.repository.RefreshTokenRepository;
import com.ravtec.delivery.repository.AuditoriaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private ClienteMapper clienteMapper;

    @InjectMocks
    private ClienteService clienteService;

    @BeforeEach
    void setUp() {
        clienteMapper = new ClienteMapper();
        clienteService = new ClienteService(
            clienteRepository,
            usuarioRepository,
            clienteMapper,
            passwordEncoder,
            refreshTokenRepository
        );
    }

    @Test
    void deveListarTodosClientesQuandoBuscaVazia() {
        var cliente = criarCliente();
        when(clienteRepository.findAll()).thenReturn(List.of(cliente));

        var resultado = clienteService.listar(null);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nome()).isEqualTo("Maria Souza");
    }

    @Test
    void deveBuscarPorNomeOuTelefoneQuandoBuscaInformada() {
        when(clienteRepository.findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase("Maria", "Maria"))
            .thenReturn(List.of(criarCliente()));

        var resultado = clienteService.listar("Maria");

        assertThat(resultado).hasSize(1);
        verify(clienteRepository).findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase("Maria", "Maria");
    }

    @Test
    void deveLancarExcecaoQuandoClienteNaoEncontrado() {
        var id = UUID.randomUUID();
        when(clienteRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clienteService.consultar(id))
            .isInstanceOf(RecursoNaoEncontradoException.class)
            .hasMessage("Cliente nao encontrado");
    }

    @Test
    void deveCriarClienteAtivoPorPadrao() {
        var request = new ClienteRequest(
            "Joao Silva", "11999990000", null, null, null,
            "Rua A, 100", "Centro", "Sao Paulo", null
        );
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = clienteService.criar(request);

        assertThat(response.ativo()).isTrue();
        assertThat(response.nome()).isEqualTo("Joao Silva");
    }

    @Test
    void deveAlterarStatusDoCliente() {
        var cliente = criarCliente();
        when(clienteRepository.findById(cliente.getId())).thenReturn(Optional.of(cliente));

        var response = clienteService.alterarStatus(cliente.getId(), new StatusRequest(false));

        assertThat(response.ativo()).isFalse();
    }

    @Test
    void desativarClienteDesativaUsuarioERevogaSessoes() {
        var cliente = criarCliente();
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setAtivo(true);
        cliente.setUsuario(usuario);
        when(clienteRepository.findById(cliente.getId())).thenReturn(Optional.of(cliente));

        clienteService.alterarStatus(cliente.getId(), new StatusRequest(false));

        assertThat(usuario.isAtivo()).isFalse();
        verify(refreshTokenRepository).revogarAtivosDoUsuario(
            org.mockito.ArgumentMatchers.eq(usuario.getId()), org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void entregadorAtivoPodeCadastrarClienteComAuditoria() {
        var identidade = org.mockito.Mockito.mock(IdentidadeAtual.class);
        var auditorias = org.mockito.Mockito.mock(AuditoriaRepository.class);
        var auditoriaService = org.mockito.Mockito.mock(AuditoriaService.class);
        var usuario = new Usuario(); usuario.setId(UUID.randomUUID()); usuario.setAtivo(true);
        usuario.setPerfil(PerfilAcesso.ENTREGADOR);
        var entregador = new Entregador(); entregador.setAtivo(true); entregador.setUsuario(usuario);
        usuario.setEntregador(entregador);
        var principal = new UsuarioPrincipal(usuario);
        when(identidade.principal()).thenReturn(principal);
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(invocation -> {
            var item = invocation.getArgument(0, Cliente.class);
            item.setId(UUID.randomUUID());
            return item;
        });
        ReflectionTestUtils.setField(clienteService, "identidadeAtual", identidade);
        ReflectionTestUtils.setField(clienteService, "auditoriaRepository", auditorias);
        ReflectionTestUtils.setField(clienteService, "auditoriaService", auditoriaService);
        ReflectionTestUtils.setField(clienteService, "limiteDiarioEntregador", 20);
        ReflectionTestUtils.setField(clienteService, "zonaNegocio", "America/Fortaleza");
        var request = new ClienteRequest(
            "Cliente do entregador", "85999998888", null, null, null,
            "Rua A, S/N", "Centro", "Fortaleza", null
        );

        var response = clienteService.criarPeloEntregador(request);

        assertThat(response.nome()).isEqualTo("Cliente do entregador");
        verify(identidade).entregadorObrigatorioParaAtualizacao();
        verify(auditoriaService).registrar(
            org.mockito.ArgumentMatchers.eq("CLIENTE_CRIADO_PELO_ENTREGADOR"),
            org.mockito.ArgumentMatchers.eq("CLIENTE"),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.isNull()
        );
    }

    private Cliente criarCliente() {
        var cliente = new Cliente();
        cliente.setId(UUID.randomUUID());
        cliente.setNome("Maria Souza");
        cliente.setTelefone("11988887777");
        cliente.setEndereco("Rua B, 200");
        cliente.setBairro("Jardins");
        cliente.setCidade("Sao Paulo");
        cliente.setAtivo(true);
        return cliente;
    }
}
