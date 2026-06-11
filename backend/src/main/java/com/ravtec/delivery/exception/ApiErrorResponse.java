package com.ravtec.delivery.exception;

import java.time.OffsetDateTime;
import java.util.List;

public record ApiErrorResponse(
    OffsetDateTime timestamp,
    int status,
    String erro,
    List<String> detalhes
) {
}

