package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.NotificacaoOutbox;
import com.ravtec.delivery.entity.StatusNotificacao;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificacaoOutboxRepository extends JpaRepository<NotificacaoOutbox, UUID> {
    boolean existsByChaveIdempotencia(String chave);
    long countByStatus(StatusNotificacao status);
    List<NotificacaoOutbox> findTop50ByStatusAndProximaTentativaEmLessThanEqualOrderByCriadoEm(
        StatusNotificacao status, OffsetDateTime agora
    );
}
