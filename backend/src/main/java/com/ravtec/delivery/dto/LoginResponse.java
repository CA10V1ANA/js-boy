package com.ravtec.delivery.dto;

public record LoginResponse(
    String token,
    UsuarioAutenticadoResponse usuario
) {
}
