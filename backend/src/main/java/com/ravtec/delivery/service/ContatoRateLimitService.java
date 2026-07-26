package com.ravtec.delivery.service;

import com.ravtec.delivery.exception.LimiteRequisicoesException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ContatoRateLimitService {

    private final ConcurrentHashMap<String, Janela> janelas = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final Duration window;

    public ContatoRateLimitService(
        @Value("${app.contact.rate-limit.max-requests:5}") int maxRequests,
        @Value("${app.contact.rate-limit.window-minutes:10}") long windowMinutes
    ) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    public void verificar(String remoteAddress) {
        var agora = Instant.now();
        var chave = hash(remoteAddress == null ? "unknown" : remoteAddress);
        var janela = janelas.compute(chave, (ignored, atual) -> {
            if (atual == null || atual.inicio().plus(window).isBefore(agora)) {
                return new Janela(agora, 1);
            }
            return new Janela(atual.inicio(), atual.quantidade() + 1);
        });

        if (janelas.size() > 10_000) {
            janelas.entrySet().removeIf(entry -> entry.getValue().inicio().plus(window).isBefore(agora));
        }
        if (janela.quantidade() > maxRequests) {
            throw new LimiteRequisicoesException("Muitas solicitacoes. Aguarde alguns minutos e tente novamente");
        }
    }

    private String hash(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponivel", exception);
        }
    }

    private record Janela(Instant inicio, int quantidade) {
    }
}
