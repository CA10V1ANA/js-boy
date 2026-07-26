package com.ravtec.delivery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record SolicitacaoEntregaClienteRequest(
    @NotBlank String enderecoOrigem,
    @NotBlank String bairroOrigem,
    @NotBlank String enderecoDestino,
    @NotBlank String bairroDestino,
    @NotBlank String destinatarioNome,
    @NotBlank String destinatarioTelefone,
    @NotBlank @Size(max = 255) String descricaoMercadoria,
    @Size(max = 500) String observacoes,
    @NotNull @DecimalMin("0.00") BigDecimal distanciaKm,
    OffsetDateTime agendadaInicio,
    OffsetDateTime agendadaFim,
    String fusoHorario,
    @Valid List<ParadaRequest> paradas
) {}
