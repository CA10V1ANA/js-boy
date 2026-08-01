package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record EntregaOperacionalResponse(
    UUID id,
    String codigo,
    String clienteNome,
    String enderecoOrigem,
    String bairroOrigem,
    String enderecoDestino,
    String bairroDestino,
    String destinatarioNome,
    String destinatarioTelefone,
    String descricaoMercadoria,
    String observacoes,
    BigDecimal valorFinal,
    StatusEntrega status,
    OffsetDateTime concluidaEm,
    OffsetDateTime criadoEm,
    List<HistoricoOperacionalResponse> historico,
    Long versao
) {
}
