package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FrequenciaRecorrencia;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RecorrenciaRequest(
    @NotNull UUID clienteId,
    @NotNull FrequenciaRecorrencia frequencia,
    @NotNull LocalDate dataInicial,
    LocalDate dataFinal,
    String diasSemana,
    @NotBlank String fusoHorario,
    LocalTime horaInicio,
    LocalTime horaFim,
    @NotBlank String enderecoOrigem,
    @NotBlank String bairroOrigem,
    @NotBlank String enderecoDestino,
    @NotBlank String bairroDestino,
    @NotBlank String destinatarioNome,
    @NotBlank String destinatarioTelefone,
    @NotBlank String descricaoMercadoria,
    @NotNull @DecimalMin("0.00") BigDecimal distanciaKm
) {}
