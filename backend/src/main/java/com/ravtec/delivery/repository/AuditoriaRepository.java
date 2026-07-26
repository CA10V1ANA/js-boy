package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Auditoria;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditoriaRepository extends JpaRepository<Auditoria, UUID> {
    List<Auditoria> findTop200ByOrderByOcorridoEmDesc();
    List<Auditoria> findTop200ByEntidadeIgnoreCaseOrderByOcorridoEmDesc(String entidade);
    List<Auditoria> findTop200ByUsuarioIdOrderByOcorridoEmDesc(UUID usuarioId);
}
