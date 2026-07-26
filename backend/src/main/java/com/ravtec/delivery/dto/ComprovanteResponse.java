package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.TipoComprovante;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ComprovanteResponse(
    UUID id, UUID entregaId, UUID paradaId, TipoComprovante tipo,
    boolean possuiArquivo, String mimeType, String recebedorNome,
    boolean possuiAssinatura, boolean localizacaoRegistrada,
    String observacao, OffsetDateTime criadoEm
) {}
