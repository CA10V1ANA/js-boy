package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.ConfiguracaoEmpresa;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracaoEmpresaRepository extends JpaRepository<ConfiguracaoEmpresa, UUID> {
}
