package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.OcorrenciaRecorrencia;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OcorrenciaRecorrenciaRepository extends JpaRepository<OcorrenciaRecorrencia, UUID> {
    boolean existsByRecorrenciaIdAndDataOcorrencia(UUID recorrenciaId, LocalDate data);
}
