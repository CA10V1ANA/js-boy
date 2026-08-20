package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.StatusEntrega;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;

public interface EntregaRepository extends JpaRepository<Entrega, UUID> {
    List<Entrega> findByCodigoContainingIgnoreCaseOrClienteNomeContainingIgnoreCase(String codigo, String clienteNome);

    List<Entrega> findByEntregadorUsuarioIdOrderByCriadoEmDesc(UUID usuarioId);

    Optional<Entrega> findByIdAndEntregadorUsuarioId(UUID id, UUID usuarioId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Entrega e where e.id = :id and e.entregador.usuario.id = :usuarioId")
    Optional<Entrega> findDoEntregadorParaAtualizacao(
        @Param("id") UUID id,
        @Param("usuarioId") UUID usuarioId
    );

    List<Entrega> findByClienteUsuarioIdOrderByCriadoEmDesc(UUID usuarioId);

    Optional<Entrega> findByIdAndClienteUsuarioId(UUID id, UUID usuarioId);

    long countByStatus(StatusEntrega status);

    @Query("select coalesce(sum(e.valorFinal), 0) from Entrega e where e.status <> com.ravtec.delivery.entity.StatusEntrega.CANCELADA")
    BigDecimal somarValorTotal();
}
