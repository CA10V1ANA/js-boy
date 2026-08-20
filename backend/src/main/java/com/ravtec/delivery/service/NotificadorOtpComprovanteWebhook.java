package com.ravtec.delivery.service;

import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(name = "app.proof.otp.provider", havingValue = "webhook")
public class NotificadorOtpComprovanteWebhook implements NotificadorOtpComprovante {
    private final RestClient client;
    private final String url;
    private final String token;

    public NotificadorOtpComprovanteWebhook(
        RestClient.Builder builder,
        @Value("${app.proof.otp.webhook-url}") String url,
        @Value("${app.proof.otp.webhook-token}") String token
    ) {
        this.client = builder.build();
        this.url = url;
        this.token = token;
    }

    @Override
    public void enviar(String destino, String codigo, UUID entregaId) {
        client.post()
            .uri(url)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .body(Map.of(
                "destination", destino,
                "code", codigo,
                "deliveryId", entregaId.toString(),
                "purpose", "DELIVERY_CONFIRMATION"
            ))
            .retrieve()
            .toBodilessEntity();
    }
}
