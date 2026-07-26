package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Entrega;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EntregaFinanceiraRepository extends JpaRepository<Entrega, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Entrega e where e.id = :id")
    Optional<Entrega> buscarParaAtualizacao(@Param("id") UUID id);
}
