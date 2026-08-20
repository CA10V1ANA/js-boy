package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.TentativaLogin;
import com.ravtec.delivery.repository.TentativaLoginRepository;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.time.Duration;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TentativaLoginService {
    private final TentativaLoginRepository repository;
    private final UsuarioRepository usuarios;
    private final TokenSeguroService tokens;
    private final LimiteRequisicoesPublicasService limitador;
    @Value("${app.security.login.source-max-requests:30}") private int limiteOrigem;
    @Value("${app.security.login.global-max-requests:1000}") private int limiteGlobal;
    @Value("${app.security.login.window-minutes:5}") private long minutosJanela;
    @Value("${app.security.login.counter-ttl-hours:24}") private long horasRetencao;

    public void verificarOrigem(String origem) {
        var janela = Duration.ofMinutes(minutosJanela);
        limitador.verificar("login-global", "global", limiteGlobal, janela);
        limitador.verificar("login-source", origem, limiteOrigem, janela);
    }

    @Transactional
    public synchronized void falha(String email) {
        var normalizado = email.trim().toLowerCase();
        if (usuarios.findByEmail(normalizado).isEmpty()) {
            return;
        }
        var hash = chave(email);
        var agora = OffsetDateTime.now();
        var item = repository.findComBloqueioByEmailHash(hash).orElseGet(() -> {
            var novo = new TentativaLogin(); novo.setEmailHash(hash); return novo;
        });
        boolean expirou = item.getUltimaTentativaEm() != null
            && item.getUltimaTentativaEm().isBefore(agora.minusHours(horasRetencao));
        item.setFalhas(expirou ? 1 : item.getFalhas() + 1);
        item.setUltimaTentativaEm(agora);
        item.setBloqueadoAte(null);
        repository.save(item);
    }

    @Transactional
    public void sucesso(String email) {
        repository.findByEmailHash(chave(email)).ifPresent(repository::delete);
    }

    @Scheduled(cron = "${app.security.login.cleanup-cron:0 17 * * * *}")
    @Transactional
    public void limparExpiradas() {
        repository.deleteExpiradas(OffsetDateTime.now().minusHours(horasRetencao));
    }

    private String chave(String email) { return tokens.hash(email.trim().toLowerCase()); }
}
