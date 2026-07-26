package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.LinkRastreamento;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinkRastreamentoRepository extends JpaRepository<LinkRastreamento, UUID> {
    Optional<LinkRastreamento> findByTokenHash(String tokenHash);
    List<LinkRastreamento> findByEntregaIdOrderByCriadoEmDesc(UUID entregaId);
}
