package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.StatusEntrega;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntregaRepository extends JpaRepository<Entrega, UUID> {
    List<Entrega> findByCodigoContainingIgnoreCaseOrClienteNomeContainingIgnoreCase(String codigo, String clienteNome);

    long countByStatus(StatusEntrega status);

    @Query("select coalesce(sum(e.valorFinal), 0) from Entrega e where e.status <> com.ravtec.delivery.entity.StatusEntrega.CANCELADA")
    BigDecimal somarValorTotal();
}
