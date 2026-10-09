package com.ravtec.delivery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public record EditarRotaRequest(@NotEmpty @Size(max = 50) List<@Valid Item> paradas) {
    public record Item(UUID id, Long versao, @NotNull @Valid ParadaRequest local) {}
}
