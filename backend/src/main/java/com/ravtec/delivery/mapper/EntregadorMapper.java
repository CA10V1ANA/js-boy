package com.ravtec.delivery.mapper;

import com.ravtec.delivery.dto.EntregadorRequest;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.entity.Entregador;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class EntregadorMapper {
    public Entregador toEntity(EntregadorRequest request) {
        var entregador = new Entregador();
        updateEntity(entregador, request);
        entregador.setAtivo(true);
        return entregador;
    }

    public void updateEntity(Entregador entregador, EntregadorRequest request) {
        entregador.setNome(request.nome().trim().replaceAll("\\s+", " "));
        entregador.setCpf(request.cpf().replaceAll("[^0-9]", ""));
        entregador.setTelefone(request.telefone().replaceAll("[^0-9]", ""));
        entregador.setEmail(request.email() == null || request.email().isBlank()
            ? null : request.email().trim().toLowerCase(Locale.ROOT));
        entregador.setTipoVeiculo(request.tipoVeiculo());
        entregador.setPlacaVeiculo(request.placaVeiculo() == null || request.placaVeiculo().isBlank()
            ? null : request.placaVeiculo().trim().toUpperCase(Locale.ROOT));
        entregador.setDisponivel(request.disponivel());
    }

    public EntregadorResponse toResponse(Entregador entregador) {
        return new EntregadorResponse(
            entregador.getId(), entregador.getNome(), entregador.getCpf(), entregador.getTelefone(),
            entregador.getEmail(), entregador.getTipoVeiculo(), entregador.getPlacaVeiculo(),
            entregador.isAtivo(), entregador.isDisponivel(), entregador.getUsuario() != null,
            entregador.getCriadoEm(), entregador.getVersion()
        );
    }
}
