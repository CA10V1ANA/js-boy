package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.PerfilAcesso;
import java.util.UUID;

public record LoginResponse(
    String token,
    UsuarioAutenticadoResponse usuario
) {
    public record UsuarioAutenticadoResponse(
        UUID id,
        String nome,
        String email,
        PerfilAcesso perfil
    ) {
    }
}

