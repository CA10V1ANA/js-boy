package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.PreferenciaNotificacao;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PreferenciaNotificacaoRepository extends JpaRepository<PreferenciaNotificacao, UUID> {
    Optional<PreferenciaNotificacao> findByClienteId(UUID clienteId);
}
