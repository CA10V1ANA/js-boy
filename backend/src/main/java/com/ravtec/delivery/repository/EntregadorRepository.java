package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Entregador;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntregadorRepository extends JpaRepository<Entregador, UUID> {
}

