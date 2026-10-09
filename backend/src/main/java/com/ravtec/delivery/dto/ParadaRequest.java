package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoParada;
import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public record ParadaRequest(
    @NotNull @Min(1) Integer ordem,
    @NotNull TipoParada tipo,
    @NotBlank @Size(max = 180) String logradouro,
    @Size(max = 30) String numero,
    boolean semNumero,
    @Size(max = 120) String complemento,
    @NotBlank @Size(max = 80) String bairro,
    @Size(max = 80) String cidade,
    @Pattern(regexp = "^[A-Za-z]{2}$") String estado,
    @Pattern(regexp = "^\\d{8}$") String cep,
    @Size(max = 140) String contatoNome,
    @Size(max = 30) String contatoTelefone,
    @Size(max = 500) String observacao,
    OffsetDateTime previstaEm
) {
    @AssertTrue(message = "Informe o número ou marque S/N para o local")
    public boolean isNumeroInformado() {
        return semNumero || (numero != null && !numero.isBlank());
    }
}
