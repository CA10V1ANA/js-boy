package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.ComprovanteEntrega;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComprovanteEntregaRepository extends JpaRepository<ComprovanteEntrega, UUID> {
    List<ComprovanteEntrega> findByEntregaIdAndSubstituidoPorIsNullOrderByCriadoEmDesc(UUID entregaId);
    Optional<ComprovanteEntrega> findByIdAndEntregaId(UUID id, UUID entregaId);
    Optional<ComprovanteEntrega> findByEntregadorUsuarioIdAndChaveIdempotencia(UUID usuarioId, String chave);
    boolean existsByEntregaIdAndTipoAndSubstituidoPorIsNull(UUID entregaId, com.ravtec.delivery.entity.TipoComprovante tipo);
    long countByEntregaIdAndSubstituidoPorIsNull(UUID entregaId);

    @Query("select coalesce(sum(c.tamanhoBytes), 0) from ComprovanteEntrega c "
        + "where c.entrega.id = :entregaId and c.substituidoPor is null")
    long somarBytesDaEntrega(@Param("entregaId") UUID entregaId);

    @Query("select coalesce(sum(c.tamanhoBytes), 0) from ComprovanteEntrega c "
        + "where c.entregador.id = :entregadorId and c.substituidoPor is null")
    long somarBytesDoEntregador(@Param("entregadorId") UUID entregadorId);

    @Query("select coalesce(sum(c.tamanhoBytes), 0) from ComprovanteEntrega c "
        + "where c.substituidoPor is null")
    long somarBytesTotal();

    @Query("select (count(c) > 0) from ComprovanteEntrega c "
        + "where c.entrega.id = :entregaId and c.tipo = com.ravtec.delivery.entity.TipoComprovante.ENTREGA "
        + "and c.verificadoEm is not null and c.substituidoPor is null "
        + "and c.parada.tipo = com.ravtec.delivery.entity.TipoParada.ENTREGA "
        + "and c.parada.ordem = (select max(p.ordem) from ParadaEntrega p "
        + "where p.entrega.id = :entregaId and p.tipo = com.ravtec.delivery.entity.TipoParada.ENTREGA)")
    boolean existsEntregaFinalVerificada(@Param("entregaId") UUID entregaId);

    @Query("select c.storageKey from ComprovanteEntrega c where c.storageKey is not null")
    List<String> findAllStorageKeys();
}
