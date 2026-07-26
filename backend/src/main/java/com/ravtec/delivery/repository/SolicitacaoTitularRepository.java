package com.ravtec.delivery.repository;
import com.ravtec.delivery.entity.SolicitacaoTitular;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SolicitacaoTitularRepository extends JpaRepository<SolicitacaoTitular, UUID> {
    List<SolicitacaoTitular> findTop200ByOrderBySolicitadaEmDesc();
}
