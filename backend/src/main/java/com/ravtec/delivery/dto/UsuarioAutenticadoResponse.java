package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import java.util.UUID;

public record UsuarioAutenticadoResponse(
    UUID id,
    String nome,
    String email,
    PerfilAcesso perfil
) {
    public static UsuarioAutenticadoResponse from(Usuario usuario) {
        return new UsuarioAutenticadoResponse(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getPerfil()
        );
    }
}
