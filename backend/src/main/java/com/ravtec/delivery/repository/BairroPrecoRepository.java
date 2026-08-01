package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.BairroPreco;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BairroPrecoRepository extends JpaRepository<BairroPreco, UUID> {
    @EntityGraph(attributePaths = "area")
    Optional<BairroPreco> findByNomeNormalizadoAndAreaAtivoTrue(String nomeNormalizado);
}
