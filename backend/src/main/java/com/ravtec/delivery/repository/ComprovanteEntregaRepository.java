package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.ComprovanteEntrega;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComprovanteEntregaRepository extends JpaRepository<ComprovanteEntrega, UUID> {
    List<ComprovanteEntrega> findByEntregaIdAndSubstituidoPorIsNullOrderByCriadoEmDesc(UUID entregaId);
    Optional<ComprovanteEntrega> findByIdAndEntregaId(UUID id, UUID entregaId);
    Optional<ComprovanteEntrega> findByEntregadorUsuarioIdAndChaveIdempotencia(UUID usuarioId, String chave);
    boolean existsByEntregaIdAndTipoAndSubstituidoPorIsNull(UUID entregaId, com.ravtec.delivery.entity.TipoComprovante tipo);
}
