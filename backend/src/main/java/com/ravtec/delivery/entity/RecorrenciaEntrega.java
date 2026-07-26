package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "recorrencias_entrega")
public class RecorrenciaEntrega extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FrequenciaRecorrencia frequencia;
    @Column(nullable = false)
    private LocalDate dataInicial;
    private LocalDate dataFinal;
    @Column(length = 40)
    private String diasSemana;
    @Column(nullable = false, length = 60)
    private String fusoHorario;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    @Column(nullable = false, length = 180)
    private String enderecoOrigem;
    @Column(nullable = false, length = 80)
    private String bairroOrigem;
    @Column(nullable = false, length = 180)
    private String enderecoDestino;
    @Column(nullable = false, length = 80)
    private String bairroDestino;
    @Column(nullable = false, length = 140)
    private String destinatarioNome;
    @Column(nullable = false, length = 30)
    private String destinatarioTelefone;
    @Column(nullable = false, length = 255)
    private String descricaoMercadoria;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal distanciaKm = BigDecimal.ZERO;
    @Column(nullable = false)
    private boolean ativa = true;
    @Version
    private Long version;
}
