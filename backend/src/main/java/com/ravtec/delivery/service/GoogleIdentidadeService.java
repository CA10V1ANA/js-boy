package com.ravtec.delivery.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GoogleIdentidadeService {

    private final ObjectMapper mapper;
    private final String clientId;
    private final RestClient client;
    private Map<String, RSAPublicKey> chaves = Map.of();
    private Instant expira = Instant.EPOCH;
    private Instant ultimaBusca = Instant.EPOCH;

    public record Identidade(String sub, String email) {}

    public GoogleIdentidadeService(
        ObjectMapper mapper,
        RestClient.Builder builder,
        @Value("${app.google.client-id:}") String clientId
    ) {
        this.mapper = mapper;
        this.clientId = clientId;
        this.client = builder.build();
    }

    public Identidade verificar(String credencial) {
        if (clientId.isBlank()) throw new IllegalStateException("Login Google ainda não configurado");
        try {
            if (credencial == null || credencial.length() > 10000) throw new IllegalArgumentException();
            var header = mapper.readTree(Base64.getUrlDecoder().decode(credencial.split("\\.")[0]));
            if (!"RS256".equals(header.path("alg").asText())) throw new IllegalArgumentException();
            var key = chave(header.path("kid").asText());
            var claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(credencial).getPayload();
            if (
                !Set.of("https://accounts.google.com", "accounts.google.com").contains(claims.getIssuer()) ||
                claims.getAudience() == null ||
                !claims.getAudience().contains(clientId) ||
                claims.getExpiration() == null ||
                !claims.getExpiration().toInstant().isAfter(Instant.now()) ||
                !Boolean.TRUE.equals(claims.get("email_verified", Boolean.class)) ||
                claims.getSubject() == null ||
                claims.getSubject().isBlank()
            ) throw new IllegalArgumentException();
            var email = claims.get("email", String.class);
            if (
                email == null || email.length() > 180 || !email.contains("@")
            ) throw new IllegalArgumentException();
            return new Identidade(claims.getSubject(), email.toLowerCase(Locale.ROOT));
        } catch (Exception e) {
            throw new BadCredentialsException("Credencial Google inválida");
        }
    }

    private synchronized RSAPublicKey chave(String kid) throws Exception {
        if (
            expira.isBefore(Instant.now()) ||
            (!chaves.containsKey(kid) && ultimaBusca.isBefore(Instant.now().minusSeconds(60)))
        ) {
            var response = client
                .get()
                .uri("https://www.googleapis.com/oauth2/v3/certs")
                .retrieve()
                .toEntity(String.class);
            var keys = mapper.readTree(response.getBody()).path("keys");
            var novas = new HashMap<String, RSAPublicKey>();
            for (var k : keys)
                if ("RSA".equals(k.path("kty").asText()) && "RS256".equals(k.path("alg").asText())) {
                    var spec = new RSAPublicKeySpec(
                        new BigInteger(1, Base64.getUrlDecoder().decode(k.path("n").asText())),
                        new BigInteger(1, Base64.getUrlDecoder().decode(k.path("e").asText()))
                    );
                    novas.put(
                        k.path("kid").asText(),
                        (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec)
                    );
                }
            chaves = Map.copyOf(novas);
            ultimaBusca = Instant.now();
            expira = ultimaBusca.plusSeconds(3600);
        }
        var key = chaves.get(kid);
        if (key == null) throw new IllegalArgumentException();
        return key;
    }
}
