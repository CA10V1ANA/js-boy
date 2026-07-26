package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "auditorias")
public class Auditoria extends BaseEntity {
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Usuario usuario;

    @Column(nullable = false, length = 120, updatable = false)
    private String usuarioNome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, updatable = false)
    private PerfilAcesso perfil;

    @Column(nullable = false, length = 60, updatable = false)
    private String acao;

    @Column(nullable = false, length = 60, updatable = false)
    private String entidade;

    @Column(nullable = false, updatable = false)
    private UUID entidadeId;

    @Column(columnDefinition = "text", updatable = false)
    private String valoresAnteriores;

    @Column(columnDefinition = "text", updatable = false)
    private String valoresPosteriores;

    @Column(length = 500, updatable = false)
    private String motivo;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime ocorridoEm;
}
