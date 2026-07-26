package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.OcorrenciaEntrega;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OcorrenciaEntregaRepository extends JpaRepository<OcorrenciaEntrega, UUID> {
    List<OcorrenciaEntrega> findByEntregaIdOrderByOcorridaEmDesc(UUID entregaId);
}
