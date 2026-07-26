package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.EntregaClienteResponse;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.mapper.EntregaMapper;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClientePortalService {

    private final IdentidadeAtual identidadeAtual;
    private final EntregaRepository entregaRepository;
    private final ClienteMapper clienteMapper;
    private final EntregaMapper entregaMapper;

    @Transactional(readOnly = true)
    public ClienteResponse meuCadastro() {
        return clienteMapper.toResponse(identidadeAtual.clienteObrigatorio());
    }

    @Transactional(readOnly = true)
    public List<EntregaClienteResponse> minhasEntregas() {
        identidadeAtual.clienteObrigatorio();
        return entregaRepository.findByClienteUsuarioIdOrderByCriadoEmDesc(identidadeAtual.principal().getId())
            .stream()
            .map(entregaMapper::toClienteResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public EntregaClienteResponse minhaEntrega(UUID id) {
        identidadeAtual.clienteObrigatorio();
        var entrega = entregaRepository.findByIdAndClienteUsuarioId(id, identidadeAtual.principal().getId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
        return entregaMapper.toClienteResponse(entrega);
    }
}
