package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.TentativaLogin;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TentativaLoginRepository extends JpaRepository<TentativaLogin, UUID> {
    Optional<TentativaLogin> findByEmailHash(String hash);
}
