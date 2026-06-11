package com.ravtec.delivery.mapper;

import com.ravtec.delivery.dto.EntregadorRequest;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.entity.Entregador;
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
        entregador.setNome(request.nome());
        entregador.setCpf(request.cpf());
        entregador.setTelefone(request.telefone());
        entregador.setEmail(request.email());
        entregador.setTipoVeiculo(request.tipoVeiculo());
        entregador.setPlacaVeiculo(request.placaVeiculo());
        entregador.setDisponivel(request.disponivel());
    }

    public EntregadorResponse toResponse(Entregador entregador) {
        return new EntregadorResponse(
            entregador.getId(),
            entregador.getNome(),
            entregador.getCpf(),
            entregador.getTelefone(),
            entregador.getEmail(),
            entregador.getTipoVeiculo(),
            entregador.getPlacaVeiculo(),
            entregador.isAtivo(),
            entregador.isDisponivel(),
            entregador.getCriadoEm()
        );
    }
}

