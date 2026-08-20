package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.DesafioComprovanteEntrega;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DesafioComprovanteEntregaRepository
    extends JpaRepository<DesafioComprovanteEntrega, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from DesafioComprovanteEntrega d where d.entrega.id = :entregaId")
    Optional<DesafioComprovanteEntrega> findByEntregaIdParaAtualizacao(
        @Param("entregaId") UUID entregaId
    );
}
