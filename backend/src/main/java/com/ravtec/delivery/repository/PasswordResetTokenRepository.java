package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.PasswordResetToken;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHash(String hash);
}
