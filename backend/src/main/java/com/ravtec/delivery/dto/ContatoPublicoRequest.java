package com.ravtec.delivery.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ContatoPublicoRequest(
    @NotBlank @Size(max = 140) String nome,
    @Size(max = 140) String empresa,
    @NotBlank @Email @Size(max = 180) String email,
    @NotBlank
    @Pattern(regexp = "\\+?[0-9]{10,15}", message = "deve conter de 10 a 15 digitos")
    String telefone,
    @NotBlank @Size(min = 10, max = 2000) String mensagem,
    @Size(max = 200) String website
) {
}
