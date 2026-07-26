package com.ravtec.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RedefinirSenhaRequest(
    @NotBlank String token,
    @NotBlank @Size(min = 12, max = 128) String novaSenha
) {}
