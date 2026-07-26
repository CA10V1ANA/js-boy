package com.ravtec.delivery.dto;

public record LoginResponse(
    String token,
    String refreshToken,
    UsuarioAutenticadoResponse usuario
) {
    public LoginResponse(String token, UsuarioAutenticadoResponse usuario) {
        this(token, null, usuario);
    }
}
