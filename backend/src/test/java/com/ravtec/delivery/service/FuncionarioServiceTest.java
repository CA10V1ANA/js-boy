package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.FuncionarioRequest;
import com.ravtec.delivery.entity.PerfilAcesso;
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
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class FuncionarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private FuncionarioService funcionarioService;

    @Test
    void deveListarApenasUsuariosComPerfilFuncionario() {
        when(usuarioRepository.findByPerfilOrderByNomeAsc(PerfilAcesso.FUNCIONARIO))
            .thenReturn(List.of(criarFuncionario()));

        var resultado = funcionarioService.listar();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nome()).isEqualTo("Ana Souza");
    }

    @Test
    void deveCriarFuncionarioComSenhaCodificada() {
        var request = new FuncionarioRequest("Ana Souza", "ana@jsboy.com", "senha123");
        when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.senha())).thenReturn("hash-codificado");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = funcionarioService.criar(request);

        assertThat(response.nome()).isEqualTo("Ana Souza");
        assertThat(response.email()).isEqualTo("ana@jsboy.com");
        assertThat(response.ativo()).isTrue();
    }

    @Test
    void deveLancarExcecaoQuandoEmailJaCadastrado() {
        var request = new FuncionarioRequest("Ana Souza", "ana@jsboy.com", "senha123");
        when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.of(criarFuncionario()));

        assertThatThrownBy(() -> funcionarioService.criar(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("E-mail ja cadastrado");
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
        return usuario;
    }
}
