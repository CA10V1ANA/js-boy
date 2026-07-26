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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Deprecated(forRemoval = false)
public class FuncionarioService {

    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<FuncionarioResponse> listar() {
        return usuarioRepository.findByPerfilInOrderByNomeAsc(
                List.of(PerfilAcesso.ENTREGADOR, PerfilAcesso.FUNCIONARIO)
            ).stream()
            .filter(usuario -> usuario.getEntregador() != null)
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public FuncionarioResponse criar(FuncionarioRequest request) {
        throw new IllegalStateException(
            "FUNCIONARIO foi descontinuado; cadastre um entregador e crie seu acesso"
        );
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

        if ((usuario.getPerfil() != PerfilAcesso.FUNCIONARIO
            && usuario.getPerfil() != PerfilAcesso.ENTREGADOR)
            || usuario.getEntregador() == null) {
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
