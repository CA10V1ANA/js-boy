package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.SolicitacaoContato;
import com.ravtec.delivery.entity.StatusSolicitacaoContato;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolicitacaoContatoRepository extends JpaRepository<SolicitacaoContato, UUID> {
    List<SolicitacaoContato> findAllByOrderByCriadoEmDesc();

    List<SolicitacaoContato> findByStatusOrderByCriadoEmDesc(StatusSolicitacaoContato status);
}
