package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.ravtec.delivery.exception.LimiteRequisicoesException;
import org.junit.jupiter.api.Test;

class RastreamentoRateLimitServiceTest {
    @Test
    void aplicaOrcamentoGlobalEntreEnderecosDiferentes() {
        var limitador = new LimiteRequisicoesPublicasService(100, java.time.Clock.systemUTC());
        var service = new RastreamentoRateLimitService(limitador, 30, 2, 5);

        service.verificar("10.0.0.1");
        service.verificar("10.0.0.2");

        assertThatThrownBy(() -> service.verificar("10.0.0.3"))
            .isInstanceOf(LimiteRequisicoesException.class);
    }
}
