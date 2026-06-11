package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Entrega;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntregaRepository extends JpaRepository<Entrega, UUID> {
}

