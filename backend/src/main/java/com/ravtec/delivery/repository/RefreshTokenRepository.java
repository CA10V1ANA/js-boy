package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.RefreshToken;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String hash);
    List<RefreshToken> findByFamiliaId(UUID familiaId);
}
