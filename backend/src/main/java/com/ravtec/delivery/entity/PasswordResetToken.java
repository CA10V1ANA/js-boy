package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Entity @Table(name = "password_reset_tokens")
public class PasswordResetToken extends BaseEntity {
    @ManyToOne(optional = false) @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;
    @Column(nullable = false)
    private OffsetDateTime expiraEm;
    private OffsetDateTime usadoEm;
    public boolean ativo() {
        return usadoEm == null && expiraEm.isAfter(OffsetDateTime.now()) && usuario.isAtivo();
    }
}
