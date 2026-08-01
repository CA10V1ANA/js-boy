package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.AreaPreco;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AreaPrecoRepository extends JpaRepository<AreaPreco, UUID> {
    @EntityGraph(attributePaths = "bairros")
    List<AreaPreco> findAllByAtivoTrueOrderByOrdemAsc();
}
