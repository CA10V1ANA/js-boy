package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByPerfilOrderByNomeAsc(PerfilAcesso perfil);
}

