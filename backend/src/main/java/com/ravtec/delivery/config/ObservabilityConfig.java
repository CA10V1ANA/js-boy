package com.ravtec.delivery.config;

import com.ravtec.delivery.entity.StatusNotificacao;
import com.ravtec.delivery.repository.NotificacaoOutboxRepository;
import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.context.annotation.*;

@Configuration
public class ObservabilityConfig {
    @Bean
    MeterBinder jsBoyMetrics(NotificacaoOutboxRepository outbox) {
        return registry -> {
            Gauge.builder("jsboy.notifications.pending", outbox,
                repository -> repository.countByStatus(StatusNotificacao.PENDENTE))
                .description("Notificacoes pendentes na outbox").register(registry);
            Gauge.builder("jsboy.notifications.failed", outbox,
                repository -> repository.countByStatus(StatusNotificacao.FALHOU))
                .description("Notificacoes com falha definitiva").register(registry);
        };
    }
}
