package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.ConfiguracaoPreco;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracaoPrecoRepository extends JpaRepository<ConfiguracaoPreco, UUID> {
}

