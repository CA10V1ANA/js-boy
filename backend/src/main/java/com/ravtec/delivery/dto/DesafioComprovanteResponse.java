package com.ravtec.delivery.dto;

import java.time.OffsetDateTime;

public record DesafioComprovanteResponse(
    String destinoMascarado,
    OffsetDateTime expiraEm
) {}
