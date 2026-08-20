package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.dto.UsuarioResponse;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.UsuarioRepository;
import com.ravtec.delivery.repository.RefreshTokenRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final IdentidadeAtual identidadeAtual;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public UsuarioResponse alterarStatus(UUID id, StatusRequest request) {
        var usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado"));
        if (usuario.getId().equals(identidadeAtual.principal().getId()) && !request.ativo()) {
            throw new IllegalArgumentException("Voce nao pode desativar a propria conta");
        }
        var anterior = usuario.isAtivo();
        usuario.setAtivo(request.ativo());
        if (!request.ativo()) {
            refreshTokenRepository.revogarAtivosDoUsuario(usuario.getId(), OffsetDateTime.now());
        }
        auditoriaService.registrar(
            request.ativo() ? "USUARIO_ATIVADO" : "USUARIO_DESATIVADO",
            "USUARIO",
            usuario.getId(),
            Map.of("ativo", anterior),
            Map.of("ativo", usuario.isAtivo()),
            null
        );
        return toResponse(usuario);
    }

    private UsuarioResponse toResponse(com.ravtec.delivery.entity.Usuario usuario) {
        var vinculo = usuario.getCliente() != null ? "CLIENTE" : usuario.getEntregador() != null ? "ENTREGADOR" : null;
        var vinculoId = usuario.getCliente() != null
            ? usuario.getCliente().getId()
            : usuario.getEntregador() != null ? usuario.getEntregador().getId() : null;
        return new UsuarioResponse(
            usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getPerfilEfetivo(),
            usuario.isAtivo(), vinculo, vinculoId, usuario.getCriadoEm()
        );
    }
}
