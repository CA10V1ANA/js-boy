package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.FuncionarioRequest;
import com.ravtec.delivery.dto.FuncionarioResponse;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FuncionarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<FuncionarioResponse> listar() {
        return usuarioRepository.findByPerfilOrderByNomeAsc(PerfilAcesso.FUNCIONARIO).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public FuncionarioResponse criar(FuncionarioRequest request) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("E-mail ja cadastrado");
        }

        var usuario = new Usuario();
        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(PerfilAcesso.FUNCIONARIO);
        usuario.setAtivo(true);

        var salvo = usuarioRepository.save(usuario);
        log.info("Acesso de funcionario criado: id={} email={}", salvo.getId(), salvo.getEmail());
        return toResponse(salvo);
    }

    @Transactional
    public FuncionarioResponse alterarStatus(UUID id, boolean ativo) {
        var usuario = buscarFuncionario(id);
        usuario.setAtivo(ativo);
        log.info("Status de funcionario alterado: id={} ativo={}", usuario.getId(), ativo);
        return toResponse(usuario);
    }

    private Usuario buscarFuncionario(UUID id) {
        var usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Funcionario nao encontrado"));

        if (usuario.getPerfil() != PerfilAcesso.FUNCIONARIO) {
            throw new RecursoNaoEncontradoException("Funcionario nao encontrado");
        }

        return usuario;
    }

    private FuncionarioResponse toResponse(Usuario usuario) {
        return new FuncionarioResponse(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.isAtivo(),
            usuario.getCriadoEm()
        );
    }
}
