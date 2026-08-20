package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.TentativaLogin;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TentativaLoginRepository extends JpaRepository<TentativaLogin, UUID> {
    Optional<TentativaLogin> findByEmailHash(String hash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<TentativaLogin> findComBloqueioByEmailHash(String hash);

    @Modifying
    @Query("delete from TentativaLogin t where t.ultimaTentativaEm is null or t.ultimaTentativaEm < :limite")
    int deleteExpiradas(@Param("limite") OffsetDateTime limite);
}
