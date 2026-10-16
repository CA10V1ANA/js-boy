package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Cliente;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, UUID> {
    List<Cliente> findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(String nome, String telefone);
    long countByAtivoTrue();
    Optional<Cliente> findByUsuarioId(UUID usuarioId);
    Optional<Cliente> findByUsuarioIdAndAtivoTrue(UUID usuarioId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Cliente c where c.usuario.id = :usuarioId and c.ativo = true")
    Optional<Cliente> buscarAtivoPorUsuarioParaAtualizacao(@org.springframework.data.repository.query.Param("usuarioId") UUID usuarioId);
    boolean existsByDocumento(String documento);
    boolean existsByDocumentoAndIdNot(String documento, UUID id);
}
