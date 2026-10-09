package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Entregador;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EntregadorRepository extends JpaRepository<Entregador, UUID> {
    List<Entregador> findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(String nome, String telefone);
    long countByAtivoTrue();
    Optional<Entregador> findByUsuarioId(UUID usuarioId);
    Optional<Entregador> findByUsuarioIdAndAtivoTrue(UUID usuarioId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Entregador e where e.usuario.id = :usuarioId and e.ativo = true")
    Optional<Entregador> findAtivoPorUsuarioParaAtualizacao(@Param("usuarioId") UUID usuarioId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Entregador e where e.id = :id")
    Optional<Entregador> buscarParaAtualizacao(@Param("id") UUID id);
    boolean existsByCpf(String cpf);
    boolean existsByCpfAndIdNot(String cpf, UUID id);
}
