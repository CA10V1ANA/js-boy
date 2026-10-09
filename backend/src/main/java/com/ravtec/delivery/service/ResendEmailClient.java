package com.ravtec.delivery.service;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ResendEmailClient {
    private final RestClient client; private final String from;
    public ResendEmailClient(RestClient.Builder builder,
        @Value("${app.resend.api-key:}") String apiKey,
        @Value("${app.resend.from:}") String from,
        @Value("${app.notifications.provider:local}") String notificationsProvider,
        @Value("${app.password-reset.provider:local}") String passwordResetProvider) {
        if (("resend".equals(notificationsProvider) || "resend".equals(passwordResetProvider))
            && (apiKey == null || apiKey.isBlank() || from == null || from.isBlank()))
            throw new IllegalArgumentException("Configure RESEND_API_KEY e RESEND_FROM para utilizar o provedor Resend");
        this.client = builder.baseUrl("https://api.resend.com")
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey).build(); this.from = from;
    }
    public void enviar(String to, String subject, String text, String idempotencyKey) {
        client.post().uri("/emails").header("Idempotency-Key", idempotencyKey)
            .body(Map.of("from", from, "to", new String[]{to}, "subject", subject, "text", text))
            .retrieve().toBodilessEntity();
    }
}
