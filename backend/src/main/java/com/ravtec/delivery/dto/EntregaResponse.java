package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusEntrega;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record EntregaResponse(
    UUID id,
    String codigo,
    UUID clienteId,
    String clienteNome,
    UUID entregadorId,
    String entregadorNome,
    String enderecoOrigem,
    String bairroOrigem,
    String enderecoDestino,
    String bairroDestino,
    String destinatarioNome,
    String destinatarioTelefone,
    String descricaoMercadoria,
    String observacoes,
    BigDecimal distanciaKm,
    BigDecimal taxaInicial,
    BigDecimal valorPorKm,
    BigDecimal valorCalculado,
    BigDecimal valorFinal,
    String observacaoValorManual,
    StatusEntrega status,
    OffsetDateTime concluidaEm,
    OffsetDateTime criadoEm,
    List<HistoricoEntregaResponse> historico
) {
}
