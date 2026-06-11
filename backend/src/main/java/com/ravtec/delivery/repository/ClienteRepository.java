package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Cliente;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, UUID> {
    List<Cliente> findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(String nome, String telefone);

    long countByAtivoTrue();
}
