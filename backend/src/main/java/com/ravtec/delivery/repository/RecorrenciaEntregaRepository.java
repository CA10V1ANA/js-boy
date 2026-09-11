package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.RecorrenciaEntrega;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecorrenciaEntregaRepository extends JpaRepository<RecorrenciaEntrega, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    List<RecorrenciaEntrega> findByAtivaTrue();
    List<RecorrenciaEntrega> findByClienteIdOrderByCriadoEmDesc(UUID clienteId);
}
