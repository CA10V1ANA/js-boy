package com.ravtec.delivery.mapper;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.entity.Cliente;
import org.springframework.stereotype.Component;

@Component
public class ClienteMapper {

    public Cliente toEntity(ClienteRequest request) {
        var cliente = new Cliente();
        updateEntity(cliente, request);
        cliente.setAtivo(true);
        return cliente;
    }

    public void updateEntity(Cliente cliente, ClienteRequest request) {
        cliente.setNome(request.nome());
        cliente.setTelefone(request.telefone());
        cliente.setWhatsapp(request.whatsapp());
        cliente.setEmail(request.email());
        cliente.setDocumento(request.documento());
        cliente.setEndereco(request.endereco());
        cliente.setBairro(request.bairro());
        cliente.setCidade(request.cidade());
        cliente.setObservacoes(request.observacoes());
    }

    public ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(
            cliente.getId(),
            cliente.getNome(),
            cliente.getTelefone(),
            cliente.getWhatsapp(),
            cliente.getEmail(),
            cliente.getDocumento(),
            cliente.getEndereco(),
            cliente.getBairro(),
            cliente.getCidade(),
            cliente.getObservacoes(),
            cliente.isAtivo(),
            cliente.getCriadoEm()
        );
    }
}

