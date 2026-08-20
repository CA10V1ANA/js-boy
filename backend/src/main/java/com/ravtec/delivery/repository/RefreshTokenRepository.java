package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.RefreshToken;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String hash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RefreshToken r join fetch r.usuario where r.tokenHash = :hash")
    Optional<RefreshToken> findByTokenHashParaAtualizacao(@Param("hash") String hash);

    List<RefreshToken> findByFamiliaId(UUID familiaId);

    @Modifying
    @Query("update RefreshToken r set r.revogadoEm = :agora where r.usuario.id = :usuarioId and r.revogadoEm is null")
    int revogarAtivosDoUsuario(@Param("usuarioId") UUID usuarioId, @Param("agora") OffsetDateTime agora);

    @Modifying
    @Query("update RefreshToken r set r.revogadoEm = :agora where r.familiaId = :familiaId and r.revogadoEm is null")
    int revogarFamilia(@Param("familiaId") UUID familiaId, @Param("agora") OffsetDateTime agora);
}
