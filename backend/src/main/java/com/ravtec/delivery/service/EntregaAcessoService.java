package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EntregaAcessoService {
    private final EntregaRepository entregaRepository;
    private final IdentidadeAtual identidadeAtual;

    public Entrega exigirLeitura(UUID entregaId) {
        var perfil = identidadeAtual.usuario().getPerfilEfetivo();
        if (perfil == PerfilAcesso.PROPRIETARIO) {
            return buscar(entregaId);
        }
        if (perfil == PerfilAcesso.CLIENTE) {
            return entregaRepository.findByIdAndClienteUsuarioId(entregaId, identidadeAtual.principal().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
        }
        if (perfil == PerfilAcesso.ENTREGADOR) {
            return exigirDoEntregador(entregaId);
        }
        throw new AccessDeniedException("Perfil sem acesso a entrega");
    }

    public Entrega exigirDoEntregador(UUID entregaId) {
        identidadeAtual.entregadorObrigatorio();
        return entregaRepository.findByIdAndEntregadorUsuarioId(entregaId, identidadeAtual.principal().getId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
    }

    public Entrega buscar(UUID entregaId) {
        return entregaRepository.findById(entregaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
    }
}
