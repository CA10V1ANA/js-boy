package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByGoogleSub(String sub);
    Optional<Usuario> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.email = :email and u.ativo = true")
    Optional<Usuario> findAtivoByEmailParaAtualizacao(@Param("email") String email);

    List<Usuario> findByPerfilOrderByNomeAsc(PerfilAcesso perfil);

    List<Usuario> findByPerfilInOrderByNomeAsc(List<PerfilAcesso> perfis);
}
