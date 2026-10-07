package com.ravtec.delivery.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.ravtec.delivery.service.MercadoPagoSignature;
import com.ravtec.delivery.service.PixService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class MercadoPagoWebhookController {
    private final MercadoPagoSignature signature;
    private final PixService pix;
    @PostMapping("/api/webhooks/mercadopago")
    public void receber(@RequestHeader(value = "x-signature", required = false) String assinatura,
        @RequestHeader(value = "x-request-id", required = false) String requestId,
        @RequestParam(value = "data.id", required = false) String id, @RequestBody JsonNode body) {
        signature.validar(assinatura, requestId, id);
        if (!"payment".equals(body.path("type").asText())) return;
        if (!id.equals(body.path("data").path("id").asText()))
            throw new IllegalArgumentException("Identificador divergente");
        pix.notificar(Long.valueOf(id));
    }
}
