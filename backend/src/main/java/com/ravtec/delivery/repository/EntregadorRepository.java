package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Entregador;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntregadorRepository extends JpaRepository<Entregador, UUID> {
    List<Entregador> findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(String nome, String telefone);

    long countByAtivoTrue();

    Optional<Entregador> findByUsuarioId(UUID usuarioId);
}
