package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.ParadaEntrega;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParadaEntregaRepository extends JpaRepository<ParadaEntrega, UUID> {
    List<ParadaEntrega> findByEntregaIdOrderByOrdem(UUID entregaId);
    Optional<ParadaEntrega> findByIdAndEntregaId(UUID id, UUID entregaId);
}
