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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
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
        var salvo = clienteRepository.save(cliente);
        log.info("Cliente criado: id={} nome={}", salvo.getId(), salvo.getNome());
        return clienteMapper.toResponse(salvo);
    }

    @Transactional
    public ClienteResponse atualizar(UUID id, ClienteRequest request) {
        var cliente = buscarEntidade(id);
        clienteMapper.updateEntity(cliente, request);
        log.info("Cliente atualizado: id={}", cliente.getId());
        return clienteMapper.toResponse(cliente);
    }

    @Transactional
    public ClienteResponse alterarStatus(UUID id, StatusRequest request) {
        var cliente = buscarEntidade(id);
        cliente.setAtivo(request.ativo());
        log.info("Status do cliente alterado: id={} ativo={}", cliente.getId(), request.ativo());
        return clienteMapper.toResponse(cliente);
    }

    private com.ravtec.delivery.entity.Cliente buscarEntidade(UUID id) {
        return clienteRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrado"));
    }
}

