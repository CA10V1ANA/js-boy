package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Entity @Table(name = "refresh_tokens")
public class RefreshToken extends BaseEntity {
    @ManyToOne(optional = false) @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;
    @Column(nullable = false)
    private UUID familiaId;
    @Column(nullable = false)
    private OffsetDateTime expiraEm;
    private OffsetDateTime revogadoEm;
    @Column(length = 64)
    private String substituidoPorHash;
    public boolean ativo() {
        return revogadoEm == null && expiraEm.isAfter(OffsetDateTime.now()) && usuario.isAtivo();
    }
}
