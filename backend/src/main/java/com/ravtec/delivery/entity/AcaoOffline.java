package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
    name = "acoes_offline",
    uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "chave_idempotencia"})
)
public class AcaoOffline extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @ManyToOne(optional = false)
    @JoinColumn(name = "entrega_id")
    private Entrega entrega;
    @Column(nullable = false, length = 180)
    private String chaveIdempotencia;
    @Column(nullable = false, length = 40)
    private String acao;
    @Column(nullable = false, length = 40)
    private String resultadoStatus;
}
