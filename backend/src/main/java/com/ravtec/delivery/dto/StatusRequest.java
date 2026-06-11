package com.ravtec.delivery.dto;

import jakarta.validation.constraints.NotNull;

public record StatusRequest(
    @NotNull Boolean ativo
) {
}

