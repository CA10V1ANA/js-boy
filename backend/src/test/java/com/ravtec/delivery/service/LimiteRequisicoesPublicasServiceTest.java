package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.ravtec.delivery.exception.LimiteRequisicoesException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class LimiteRequisicoesPublicasServiceTest {
    @Test
    void limitaPorChaveSemBloquearOutraOrigem() {
        var clock = new MutableClock();
        var service = new LimiteRequisicoesPublicasService(10, clock);

        service.verificar("login", "10.0.0.1", 2, Duration.ofMinutes(5));
        service.verificar("login", "10.0.0.1", 2, Duration.ofMinutes(5));

        assertThatThrownBy(() -> service.verificar("login", "10.0.0.1", 2, Duration.ofMinutes(5)))
            .isInstanceOf(LimiteRequisicoesException.class);
        service.verificar("login", "10.0.0.2", 2, Duration.ofMinutes(5));
    }

    @Test
    void removeChavesExpiradasELimitaCardinalidade() {
        var clock = new MutableClock();
        var service = new LimiteRequisicoesPublicasService(10, clock);
        for (int i = 0; i < 30; i++) {
            service.verificar("tracking", "source-" + i, 2, Duration.ofMinutes(5));
        }
        assertThat(service.quantidadeChaves()).isLessThanOrEqualTo(10);

        clock.avancar(Duration.ofMinutes(6));
        assertThat(service.quantidadeChaves()).isZero();
    }

    private static class MutableClock extends Clock {
        private Instant instant = Instant.parse("2026-08-20T12:00:00Z");

        void avancar(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }
}
