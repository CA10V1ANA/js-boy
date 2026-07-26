package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
    name = "ocorrencias_recorrencia",
    uniqueConstraints = @UniqueConstraint(columnNames = {"recorrencia_id", "data_ocorrencia"})
)
public class OcorrenciaRecorrencia extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "recorrencia_id")
    private RecorrenciaEntrega recorrencia;
    @Column(nullable = false)
    private LocalDate dataOcorrencia;
    @OneToOne(optional = false)
    @JoinColumn(name = "entrega_id")
    private Entrega entrega;
}
