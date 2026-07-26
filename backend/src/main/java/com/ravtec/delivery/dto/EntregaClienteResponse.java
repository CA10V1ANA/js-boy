package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record EntregaClienteResponse(
    UUID id,
    String codigo,
    String enderecoOrigem,
    String bairroOrigem,
    String enderecoDestino,
    String bairroDestino,
    String destinatarioNome,
    String descricaoMercadoria,
    BigDecimal valorFinal,
    StatusEntrega status,
    OffsetDateTime concluidaEm,
    OffsetDateTime criadoEm,
    List<HistoricoClienteResponse> historico
) {
}
