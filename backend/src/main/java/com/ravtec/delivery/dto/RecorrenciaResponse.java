package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FrequenciaRecorrencia;
import java.time.LocalDate;
import java.util.UUID;

public record RecorrenciaResponse(
    UUID id, UUID clienteId, FrequenciaRecorrencia frequencia,
    LocalDate dataInicial, LocalDate dataFinal, String diasSemana,
    String fusoHorario, boolean ativa, Long versao
) {}
