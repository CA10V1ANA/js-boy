package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.HistoricoEntrega;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoricoEntregaRepository extends JpaRepository<HistoricoEntrega, UUID> {
}

