package com.ravtec.delivery.service;

import java.time.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RastreamentoRateLimitService {
    private final LimiteRequisicoesPublicasService limitador;
    private final int limite;
    private final int limiteGlobal;
    private final Duration duracao;

    public RastreamentoRateLimitService(
        LimiteRequisicoesPublicasService limitador,
        @Value("${app.tracking.rate-limit.max-requests:30}") int limite,
        @Value("${app.tracking.rate-limit.global-max-requests:3000}") int limiteGlobal,
        @Value("${app.tracking.rate-limit.window-minutes:5}") long minutos
    ) {
        this.limitador = limitador;
        this.limite = limite;
        this.limiteGlobal = limiteGlobal;
        this.duracao = Duration.ofMinutes(minutos);
    }

    public void verificar(String chaveAnonima) {
        limitador.verificar("tracking-global", "global", limiteGlobal, duracao);
        limitador.verificar("tracking-source", chaveAnonima, limite, duracao);
    }
}
