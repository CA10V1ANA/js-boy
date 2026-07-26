package com.ravtec.delivery.mapper;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.entity.Cliente;
import java.util.Locale;
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
        var logradouro = texto(request.logradouro()) == null ? texto(request.endereco()) : texto(request.logradouro());
        var numero = request.semNumero() ? "S/N" : texto(request.numero());
        cliente.setNome(texto(request.nome()));
        cliente.setTelefone(digitos(request.telefone()));
        cliente.setWhatsapp(digitos(request.whatsapp()));
        cliente.setEmail(request.email() == null ? null : request.email().trim().toLowerCase(Locale.ROOT));
        cliente.setDocumento(digitos(request.documento()));
        cliente.setCep(digitos(request.cep()));
        cliente.setLogradouro(logradouro);
        cliente.setNumero(numero);
        cliente.setSemNumero(request.semNumero());
        cliente.setComplemento(texto(request.complemento()));
        cliente.setEndereco(numero == null ? logradouro : logradouro + ", " + numero);
        cliente.setBairro(texto(request.bairro()));
        cliente.setCidade(texto(request.cidade()));
        cliente.setEstado(request.estado() == null ? null : request.estado().trim().toUpperCase(Locale.ROOT));
        cliente.setObservacoes(texto(request.observacoes()));
    }

    public ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(
            cliente.getId(), cliente.getNome(), cliente.getTelefone(), cliente.getWhatsapp(), cliente.getEmail(),
            cliente.getDocumento(), cliente.getEndereco(), cliente.getBairro(), cliente.getCidade(),
            cliente.getObservacoes(), cliente.isAtivo(), cliente.getUsuario() != null, cliente.getCriadoEm(),
            cliente.getCep(), cliente.getLogradouro(), cliente.getNumero(), cliente.getComplemento(),
            cliente.getEstado(), cliente.isSemNumero(), cliente.getVersion()
        );
    }

    private String digitos(String value) {
        return value == null || value.isBlank() ? null : value.replaceAll("[^0-9]", "");
    }

    private String texto(String value) {
        return value == null || value.isBlank() ? null : value.trim().replaceAll("\\s+", " ");
    }
}
