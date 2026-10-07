package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.CobrancaPix;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CobrancaPixRepository extends JpaRepository<CobrancaPix, UUID> {
    Optional<CobrancaPix> findByEntregaId(UUID entregaId);
    boolean existsByPagamentoId(UUID pagamentoId);
}
