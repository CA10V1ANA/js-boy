package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Cliente;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, UUID> {
}

