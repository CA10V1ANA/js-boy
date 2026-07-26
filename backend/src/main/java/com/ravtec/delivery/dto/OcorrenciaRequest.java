package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoOcorrencia;
import jakarta.validation.constraints.*;
import java.util.UUID;

public record OcorrenciaRequest(
    UUID paradaId,
    @NotNull TipoOcorrencia tipo,
    @NotBlank @Size(max = 180) String motivo,
    @Size(max = 500) String observacao,
    @NotBlank @Size(max = 300) String proximaAcao
) {}
