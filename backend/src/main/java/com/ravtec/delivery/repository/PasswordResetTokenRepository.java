package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.PasswordResetToken;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHash(String hash);
    Optional<PasswordResetToken> findTopByUsuarioIdOrderByCriadoEmDesc(UUID usuarioId);
    long deleteByUsuarioId(UUID usuarioId);

    @Modifying
    @Query("delete from PasswordResetToken p where p.usadoEm is not null or p.expiraEm <= :agora")
    int deleteExpiradosOuUsados(@Param("agora") OffsetDateTime agora);
}
