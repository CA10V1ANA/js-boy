package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "historico_entregas")
public class HistoricoEntrega extends BaseEntity {

    @ManyToOne(optional = false)
    private Entrega entrega;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private StatusEntrega statusAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusEntrega novoStatus;

    @ManyToOne(optional = false)
    private Usuario usuarioResponsavel;

    @Column(nullable = false)
    private OffsetDateTime alteradoEm = OffsetDateTime.now();
}

