package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "ocorrencias_entrega")
public class OcorrenciaEntrega extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "entrega_id")
    private Entrega entrega;
    @ManyToOne
    @JoinColumn(name = "parada_id")
    private ParadaEntrega parada;
    @ManyToOne(optional = false)
    @JoinColumn(name = "entregador_id")
    private Entregador entregador;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoOcorrencia tipo;
    @Column(nullable = false, length = 180)
    private String motivo;
    @Column(length = 500)
    private String observacao;
    @Column(nullable = false, length = 300)
    private String proximaAcao;
    @Column(nullable = false)
    private OffsetDateTime ocorridaEm = OffsetDateTime.now();
}
