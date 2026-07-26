package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.TentativaLogin;
import com.ravtec.delivery.repository.TentativaLoginRepository;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.LockedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TentativaLoginService {
    private final TentativaLoginRepository repository;
    private final TokenSeguroService tokens;
    @Value("${app.security.login.max-failures:5}") private int maxFalhas;
    @Value("${app.security.login.lock-minutes:15}") private long minutos;

    @Transactional(readOnly = true)
    public void verificar(String email) {
        repository.findByEmailHash(chave(email)).ifPresent(item -> {
            if (item.getBloqueadoAte() != null && item.getBloqueadoAte().isAfter(OffsetDateTime.now())) {
                throw new LockedException("Acesso temporariamente bloqueado");
            }
        });
    }

    @Transactional
    public void falha(String email) {
        var hash = chave(email);
        var item = repository.findByEmailHash(hash).orElseGet(() -> {
            var novo = new TentativaLogin(); novo.setEmailHash(hash); return novo;
        });
        item.setFalhas(item.getFalhas() + 1);
        item.setUltimaTentativaEm(OffsetDateTime.now());
        if (item.getFalhas() >= maxFalhas) item.setBloqueadoAte(OffsetDateTime.now().plusMinutes(minutos));
        repository.save(item);
    }

    @Transactional
    public void sucesso(String email) {
        repository.findByEmailHash(chave(email)).ifPresent(repository::delete);
    }
    private String chave(String email) { return tokens.hash(email.trim().toLowerCase()); }
}
