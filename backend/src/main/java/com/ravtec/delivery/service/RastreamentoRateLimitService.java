package com.ravtec.delivery.service;

import com.ravtec.delivery.exception.LimiteRequisicoesException;
import java.time.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RastreamentoRateLimitService {
    private final ConcurrentHashMap<String, Janela> janelas = new ConcurrentHashMap<>();
    private final int limite;
    private final Duration duracao;

    public RastreamentoRateLimitService(
        @Value("${app.tracking.rate-limit.max-requests:30}") int limite,
        @Value("${app.tracking.rate-limit.window-minutes:5}") long minutos
    ) {
        this.limite = limite;
        this.duracao = Duration.ofMinutes(minutos);
    }

    public void verificar(String chaveAnonima) {
        var agora = Instant.now();
        var janela = janelas.compute(chaveAnonima == null ? "unknown" : Integer.toHexString(chaveAnonima.hashCode()),
            (k, atual) -> atual == null || atual.inicio.plus(duracao).isBefore(agora)
                ? new Janela(agora, 1) : new Janela(atual.inicio, atual.quantidade + 1));
        if (janela.quantidade > limite) throw new LimiteRequisicoesException("Limite de rastreamento excedido");
    }

    private record Janela(Instant inicio, int quantidade) {}
}
