package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.EntregadorRequest;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.EntregadorMapper;
import com.ravtec.delivery.repository.EntregadorRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EntregadorService {

    private final EntregadorRepository entregadorRepository;
    private final EntregadorMapper entregadorMapper;

    @Transactional(readOnly = true)
    public List<EntregadorResponse> listar(String busca) {
        var entregadores = busca == null || busca.isBlank()
            ? entregadorRepository.findAll()
            : entregadorRepository.findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(busca, busca);

        return entregadores.stream().map(entregadorMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EntregadorResponse consultar(UUID id) {
        return entregadorMapper.toResponse(buscarEntidade(id));
    }

    @Transactional
    public EntregadorResponse criar(EntregadorRequest request) {
        var entregador = entregadorMapper.toEntity(request);
        return entregadorMapper.toResponse(entregadorRepository.save(entregador));
    }

    @Transactional
    public EntregadorResponse atualizar(UUID id, EntregadorRequest request) {
        var entregador = buscarEntidade(id);
        entregadorMapper.updateEntity(entregador, request);
        return entregadorMapper.toResponse(entregador);
    }

    @Transactional
    public EntregadorResponse alterarStatus(UUID id, StatusRequest request) {
        var entregador = buscarEntidade(id);
        entregador.setAtivo(request.ativo());
        return entregadorMapper.toResponse(entregador);
    }

    private com.ravtec.delivery.entity.Entregador buscarEntidade(UUID id) {
        return entregadorRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador nao encontrado"));
    }
}

