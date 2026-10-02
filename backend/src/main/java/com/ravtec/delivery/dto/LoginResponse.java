package com.ravtec.delivery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
    String token,
    String refreshToken,
    UsuarioAutenticadoResponse usuario
) {
    public LoginResponse(String token, UsuarioAutenticadoResponse usuario) {
        this(token, null, usuario);
    }
}
