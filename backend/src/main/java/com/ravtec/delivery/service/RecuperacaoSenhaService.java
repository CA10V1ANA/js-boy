package com.ravtec.delivery.service;

import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.entity.PasswordResetToken;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecuperacaoSenhaService {
    private final UsuarioRepository usuarios;
    private final PasswordResetTokenRepository repository;
    private final RefreshTokenRepository refreshTokens;
    private final TokenSeguroService tokens;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetNotifier notifier;

    @Transactional
    public void solicitar(String email) {
        usuarios.findByEmail(email.trim().toLowerCase()).filter(u -> u.isAtivo()).ifPresent(usuario -> {
            String token = tokens.gerar();
            var item = new PasswordResetToken();
            item.setUsuario(usuario); item.setTokenHash(tokens.hash(token));
            item.setExpiraEm(OffsetDateTime.now().plusMinutes(20));
            repository.save(item);
            notifier.enviar(usuario.getEmail(), token);
        });
    }

    @Transactional
    public void redefinir(String token, String senha) {
        validarSenha(senha);
        var item = repository.findByTokenHash(tokens.hash(token))
            .filter(PasswordResetToken::ativo)
            .orElseThrow(() -> new BadCredentialsException("Token invalido ou expirado"));
        item.setUsadoEm(OffsetDateTime.now());
        item.getUsuario().setSenhaHash(passwordEncoder.encode(senha));
        refreshTokens.findAll().stream().filter(r -> r.getUsuario().getId().equals(item.getUsuario().getId()))
            .forEach(r -> r.setRevogadoEm(OffsetDateTime.now()));
    }

    private void validarSenha(String senha) {
        if (senha == null || senha.length() < 12 || !senha.matches(".*[A-Z].*")
            || !senha.matches(".*[a-z].*") || !senha.matches(".*\\d.*")) {
            throw new IllegalArgumentException("A senha deve ter 12 caracteres, maiuscula, minuscula e numero");
        }
    }
}
