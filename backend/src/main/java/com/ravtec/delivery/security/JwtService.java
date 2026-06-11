package com.ravtec.delivery.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMinutes;

    public JwtService(
        @Value("${app.security.jwt-secret}") String jwtSecret,
        @Value("${app.security.jwt-expiration-minutes:480}") long expirationMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(normalizeSecret(jwtSecret).getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String gerarToken(UsuarioPrincipal principal) {
        var agora = Instant.now();

        return Jwts.builder()
            .subject(principal.getUsername())
            .claim("nome", principal.getNome())
            .claim("perfil", principal.getUsuario().getPerfil().name())
            .issuedAt(Date.from(agora))
            .expiration(Date.from(agora.plusSeconds(expirationMinutes * 60)))
            .signWith(secretKey)
            .compact();
    }

    public String extrairEmail(String token) {
        return claims(token).getSubject();
    }

    public boolean tokenValido(String token, UserDetails userDetails) {
        var email = extrairEmail(token);
        return email.equals(userDetails.getUsername()) && claims(token).getExpiration().after(new Date());
    }

    private Claims claims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private String normalizeSecret(String secret) {
        if (secret.length() >= 32) {
            return secret;
        }

        return (secret + "00000000000000000000000000000000").substring(0, 32);
    }
}

