package com.ravtec.delivery.service;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@ConditionalOnProperty(name = "app.password-reset.provider", havingValue = "resend")
public class PasswordResetResendNotifier implements PasswordResetNotifier {
    private final ResendEmailClient email; private final String frontendUrl;
    public PasswordResetResendNotifier(ResendEmailClient email, @Value("${app.frontend-url}") String frontendUrl) {
        this.email = email; this.frontendUrl = frontendUrl;
    }
    @Override public void enviar(String destino, String token) {
        String link = UriComponentsBuilder.fromUriString(frontendUrl).path("/redefinir-senha")
            .queryParam("token", token).encode(StandardCharsets.UTF_8).build().toUriString();
        email.enviar(destino, "Redefinição de senha - JS Boy",
            "Recebemos uma solicitação para redefinir sua senha. Acesse: " + link + "\nO link expira em 20 minutos. Se não foi você, ignore.",
            "password-reset-" + UUID.nameUUIDFromBytes(token.getBytes(StandardCharsets.UTF_8)));
    }
}
