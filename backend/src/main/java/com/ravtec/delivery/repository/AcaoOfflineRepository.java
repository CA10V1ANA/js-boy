package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.AcaoOffline;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcaoOfflineRepository extends JpaRepository<AcaoOffline, UUID> {
    Optional<AcaoOffline> findByUsuarioIdAndChaveIdempotencia(UUID usuarioId, String chave);
}
