package com.ravtec.delivery.dto;

import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;
import java.util.*;

public final class ConversaDto {

    private ConversaDto() {}

    public record Envio(@NotNull UUID envioId, @NotBlank @Size(max = 2000) String conteudo) {}

    public record Leitura(@Min(0) long sequencia) {}

    public record Reabertura(@NotBlank @Size(max = 500) String motivo, @NotNull OffsetDateTime ate) {}

    public record Mensagem(
        UUID id,
        long sequencia,
        String autorNome,
        UUID autorId,
        String contexto,
        String tipo,
        String conteudo,
        OffsetDateTime criadaEm,
        UUID envioId
    ) {}

    public record Resumo(
        UUID id,
        UUID entregaId,
        String codigo,
        String clienteNome,
        String status,
        long ultimaSequencia,
        boolean naoLida,
        String ultimaMensagem,
        OffsetDateTime atualizadaEm
    ) {}

    public record Detalhe(
        UUID id,
        UUID entregaId,
        String codigo,
        String status,
        long ultimaSequencia,
        boolean podeEnviar,
        OffsetDateTime encerraEm,
        List<String> participantes
    ) {}
}
