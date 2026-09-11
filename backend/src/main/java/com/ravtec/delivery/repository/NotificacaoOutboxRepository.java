package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.NotificacaoOutbox;
import com.ravtec.delivery.entity.StatusNotificacao;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificacaoOutboxRepository extends JpaRepository<NotificacaoOutbox, UUID> {
    @org.springframework.data.jpa.repository.Query(value = """
        select * from notificacoes_outbox
        where status = 'PENDENTE' and proxima_tentativa_em <= :agora
        order by criado_em, id limit 1 for update skip locked
        """, nativeQuery = true)
    java.util.Optional<NotificacaoOutbox> reservarProxima(
        @org.springframework.data.repository.query.Param("agora") OffsetDateTime agora);
    boolean existsByChaveIdempotencia(String chave);
    long countByStatus(StatusNotificacao status);
    List<NotificacaoOutbox> findTop50ByStatusAndProximaTentativaEmLessThanEqualOrderByCriadoEm(
        StatusNotificacao status, OffsetDateTime agora
    );
}
