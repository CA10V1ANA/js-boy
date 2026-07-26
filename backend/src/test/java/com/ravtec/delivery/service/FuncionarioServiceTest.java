package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.FuncionarioRequest;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Entregador;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FuncionarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private FuncionarioService funcionarioService;

    @Test
    void deveListarApenasUsuariosComPerfilFuncionario() {
        when(usuarioRepository.findByPerfilInOrderByNomeAsc(
            List.of(PerfilAcesso.ENTREGADOR, PerfilAcesso.FUNCIONARIO)
        ))
            .thenReturn(List.of(criarFuncionario()));

        var resultado = funcionarioService.listar();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nome()).isEqualTo("Ana Souza");
    }

    @Test
    void deveRejeitarCriacaoDoPerfilLegadoFuncionario() {
        var request = new FuncionarioRequest("Ana Souza", "ana@jsboy.com", "senha123");

        assertThatThrownBy(() -> funcionarioService.criar(request))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("descontinuado");
    }

    @Test
    void deveAlterarStatusDoFuncionario() {
        var funcionario = criarFuncionario();
        when(usuarioRepository.findById(funcionario.getId())).thenReturn(Optional.of(funcionario));

        var response = funcionarioService.alterarStatus(funcionario.getId(), false);

        assertThat(response.ativo()).isFalse();
    }

    @Test
    void deveLancarExcecaoAoAlterarStatusDeUsuarioQueNaoEhFuncionario() {
        var proprietario = criarFuncionario();
        proprietario.setPerfil(PerfilAcesso.PROPRIETARIO);
        when(usuarioRepository.findById(proprietario.getId())).thenReturn(Optional.of(proprietario));

        assertThatThrownBy(() -> funcionarioService.alterarStatus(proprietario.getId(), false))
            .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    private Usuario criarFuncionario() {
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setNome("Ana Souza");
        usuario.setEmail("ana@jsboy.com");
        usuario.setSenhaHash("hash");
        usuario.setPerfil(PerfilAcesso.FUNCIONARIO);
        usuario.setAtivo(true);
        var entregador = new Entregador();
        entregador.setId(UUID.randomUUID());
        entregador.setUsuario(usuario);
        usuario.setEntregador(entregador);
        return usuario;
    }
}
