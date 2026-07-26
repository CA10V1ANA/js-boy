package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import java.time.OffsetDateTime;
import java.util.List;

public record RastreamentoPublicoResponse(
    String codigoPublico,
    StatusEntrega status,
    List<MarcoPublico> linhaDoTempo,
    OffsetDateTime estimativa,
    OffsetDateTime concluidaEm,
    ContatoPublico empresa
) {
    public record MarcoPublico(StatusEntrega status, OffsetDateTime data) {}
    public record ContatoPublico(String nome, String telefone, String whatsapp, String email, String horario) {}
}
