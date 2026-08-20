package com.ravtec.delivery.service;

import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.entity.PasswordResetToken;
import java.time.Duration;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
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
    private final LimiteRequisicoesPublicasService limitador;
    @Value("${app.security.password-reset.source-max-requests:5}") private int limiteOrigem;
    @Value("${app.security.password-reset.global-max-requests:300}") private int limiteGlobal;
    @Value("${app.security.password-reset.window-minutes:60}") private long minutosJanela;
    @Value("${app.security.password-reset.account-cooldown-seconds:60}") private long segundosCooldown;

    @Transactional
    public void solicitar(String email, String origem) {
        var janela = Duration.ofMinutes(minutosJanela);
        limitador.verificar("password-reset-global", "global", limiteGlobal, janela);
        limitador.verificar("password-reset-source", origem, limiteOrigem, janela);
        var agora = OffsetDateTime.now();
        repository.deleteExpiradosOuUsados(agora);
        usuarios.findAtivoByEmailParaAtualizacao(email.trim().toLowerCase())
            .filter(com.ravtec.delivery.entity.Usuario::isAcessoAtivo).ifPresent(usuario -> {
            var ultimo = repository.findTopByUsuarioIdOrderByCriadoEmDesc(usuario.getId());
            if (ultimo.isPresent() && ultimo.get().getCriadoEm() != null
                && ultimo.get().getCriadoEm().isAfter(agora.minusSeconds(segundosCooldown))) {
                return;
            }
            repository.deleteByUsuarioId(usuario.getId());
            String token = tokens.gerar();
            var item = new PasswordResetToken();
            item.setUsuario(usuario); item.setTokenHash(tokens.hash(token));
            item.setExpiraEm(agora.plusMinutes(20));
            repository.save(item);
            notifier.enviar(usuario.getEmail(), token);
        });
    }

    @Transactional
    public void solicitar(String email) {
        solicitar(email, "unknown");
    }

    @Transactional
    public void redefinir(String token, String senha) {
        validarSenha(senha);
        var item = repository.findByTokenHash(tokens.hash(token))
            .filter(PasswordResetToken::ativo)
            .orElseThrow(() -> new BadCredentialsException("Token invalido ou expirado"));
        item.setUsadoEm(OffsetDateTime.now());
        item.getUsuario().setSenhaHash(passwordEncoder.encode(senha));
        refreshTokens.revogarAtivosDoUsuario(item.getUsuario().getId(), OffsetDateTime.now());
    }

    @Scheduled(cron = "${app.security.password-reset.cleanup-cron:0 23 * * * *}")
    @Transactional
    public void limparExpirados() {
        repository.deleteExpiradosOuUsados(OffsetDateTime.now());
    }

    private void validarSenha(String senha) {
        if (senha == null || senha.length() < 12 || !senha.matches(".*[A-Z].*")
            || !senha.matches(".*[a-z].*") || !senha.matches(".*\\d.*")) {
            throw new IllegalArgumentException("A senha deve ter 12 caracteres, maiuscula, minuscula e numero");
        }
    }
}
