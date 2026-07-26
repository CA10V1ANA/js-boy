package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.PerfilAcesso;
import java.time.OffsetDateTime;
import java.util.UUID;

public record UsuarioResponse(
    UUID id,
    String nome,
    String email,
    PerfilAcesso perfil,
    boolean ativo,
    String vinculo,
    UUID vinculoId,
    OffsetDateTime criadoEm
) {
}
