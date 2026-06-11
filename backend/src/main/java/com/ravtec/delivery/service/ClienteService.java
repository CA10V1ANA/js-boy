package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.repository.ClienteRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar(String busca) {
        var clientes = busca == null || busca.isBlank()
            ? clienteRepository.findAll()
            : clienteRepository.findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(busca, busca);

        return clientes.stream().map(clienteMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse consultar(UUID id) {
        return clienteMapper.toResponse(buscarEntidade(id));
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        var cliente = clienteMapper.toEntity(request);
        return clienteMapper.toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse atualizar(UUID id, ClienteRequest request) {
        var cliente = buscarEntidade(id);
        clienteMapper.updateEntity(cliente, request);
        return clienteMapper.toResponse(cliente);
    }

    @Transactional
    public ClienteResponse alterarStatus(UUID id, StatusRequest request) {
        var cliente = buscarEntidade(id);
        cliente.setAtivo(request.ativo());
        return clienteMapper.toResponse(cliente);
    }

    private com.ravtec.delivery.entity.Cliente buscarEntidade(UUID id) {
        return clienteRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrado"));
    }
}

