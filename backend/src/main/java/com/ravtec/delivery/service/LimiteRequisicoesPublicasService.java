package com.ravtec.delivery.service;

import com.ravtec.delivery.exception.LimiteRequisicoesException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Limitador local, atomico e com cardinalidade/TTL limitados. O proxy de borda
 * continua sendo a primeira camada; esta e a protecao de ultimo recurso da API.
 */
@Service
public class LimiteRequisicoesPublicasService {
    private final Map<String, Janela> janelas = new LinkedHashMap<>(128, 0.75f, true);
    private final int maximoChaves;
    private final Clock clock;

    @Autowired
    public LimiteRequisicoesPublicasService(
        @Value("${app.security.public-rate-limit.max-keys:10000}") int maximoChaves
    ) {
        this(maximoChaves, Clock.systemUTC());
    }

    LimiteRequisicoesPublicasService(int maximoChaves, Clock clock) {
        if (maximoChaves < 10) {
            throw new IllegalArgumentException("O limite de chaves deve ser pelo menos 10");
        }
        this.maximoChaves = maximoChaves;
        this.clock = clock;
    }

    public synchronized void verificar(String escopo, String chave, int limite, Duration duracao) {
        if (limite < 1 || duracao.isZero() || duracao.isNegative()) {
            throw new IllegalArgumentException("Configuracao de rate limit invalida");
        }
        var agora = clock.instant();
        removerExpiradas(agora);
        var chaveInterna = escopo + ":" + hash(chave == null || chave.isBlank() ? "unknown" : chave);
        var atual = janelas.get(chaveInterna);
        if (atual == null || !agora.isBefore(atual.expiraEm())) {
            reservarEspaco();
            atual = new Janela(agora, agora.plus(duracao), 1);
        } else {
            atual = new Janela(atual.inicio(), atual.expiraEm(), atual.quantidade() + 1);
        }
        janelas.put(chaveInterna, atual);
        if (atual.quantidade() > limite) {
            throw new LimiteRequisicoesException("Limite de requisicoes excedido");
        }
    }

    synchronized int quantidadeChaves() {
        removerExpiradas(clock.instant());
        return janelas.size();
    }

    private void removerExpiradas(Instant agora) {
        janelas.entrySet().removeIf(entry -> !agora.isBefore(entry.getValue().expiraEm()));
    }

    private void reservarEspaco() {
        if (janelas.size() < maximoChaves) {
            return;
        }
        Iterator<String> iterator = janelas.keySet().iterator();
        if (iterator.hasNext()) {
            iterator.next();
            iterator.remove();
        }
    }

    private String hash(String valor) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(valor.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private record Janela(Instant inicio, Instant expiraEm, int quantidade) {}
}
