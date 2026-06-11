package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "entregas")
public class Entrega extends BaseEntity {

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @ManyToOne(optional = false)
    private Cliente cliente;

    @ManyToOne
    private Entregador entregador;

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

    @Column(length = 500)
    private String observacoes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal distanciaKm = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxaInicial = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPorKm = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorCalculado = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorFinal = BigDecimal.ZERO;

    @Column(length = 500)
    private String observacaoValorManual;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusEntrega status = StatusEntrega.SOLICITADA;

    private OffsetDateTime concluidaEm;

    @OneToMany(mappedBy = "entrega")
    private List<HistoricoEntrega> historico = new ArrayList<>();
}

