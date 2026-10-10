package com.ravtec.delivery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CadastroClienteRequest(
    @NotNull @Valid ClienteRequest cliente,
    @NotBlank @Size(min = 12, max = 72) String senha
) {}
