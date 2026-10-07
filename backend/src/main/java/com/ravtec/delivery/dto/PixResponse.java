package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.CobrancaPix;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PixResponse(UUID id, Long mercadoPagoId, BigDecimal valor, String status,
    String qrCodeBase64, String qrCodeCopiaECola, OffsetDateTime expiraEm) {
    public static PixResponse of(CobrancaPix c) {
        return new PixResponse(c.getId(), c.getMercadoPagoId(), c.getValor(), c.getStatus(),
            c.getQrCodeBase64(), c.getQrCodeCopiaECola(), c.getExpiraEm());
    }
}
