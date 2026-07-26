package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.PerfilAcesso;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditoriaResponse(
    UUID id,
    UUID usuarioId,
    String usuarioNome,
    PerfilAcesso perfil,
    String acao,
    String entidade,
    UUID entidadeId,
    String valoresAnteriores,
    String valoresPosteriores,
    String motivo,
    OffsetDateTime ocorridoEm
) {
}
