package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.repository.ClienteRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    private ClienteMapper clienteMapper;

    @InjectMocks
    private ClienteService clienteService;

    @BeforeEach
    void setUp() {
        clienteMapper = new ClienteMapper();
        clienteService = new ClienteService(clienteRepository, clienteMapper);
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
