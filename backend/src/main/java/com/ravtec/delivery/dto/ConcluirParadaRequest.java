package com.ravtec.delivery.dto;

import jakarta.validation.constraints.Size;

/** Dados opcionais da conclusão de uma parada. Não há foto nem código de confirmação. */
public record ConcluirParadaRequest(
    @Size(max = 140) String recebedorNome,
    @Size(max = 500) String observacao
) {}
