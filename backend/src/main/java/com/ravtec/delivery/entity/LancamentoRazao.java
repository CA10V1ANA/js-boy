package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Entity @Table(name = "lancamentos_razao")
public class LancamentoRazao extends BaseEntity {
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30, updatable = false)
    private TipoLancamentoRazao tipo;
    @Column(nullable = false, length = 180, updatable = false)
    private String descricao;
    @Column(nullable = false, precision = 14, scale = 2, updatable = false)
    private BigDecimal valor;
    @Column(nullable = false, updatable = false)
    private OffsetDateTime ocorridoEm;
    @Column(nullable = false, updatable = false)
    private LocalDate competencia;
    @ManyToOne @JoinColumn(name = "cliente_id", updatable = false)
    private Cliente cliente;
    @ManyToOne @JoinColumn(name = "entregador_id", updatable = false)
    private Entregador entregador;
    @ManyToOne @JoinColumn(name = "entrega_id", updatable = false)
    private Entrega entrega;
    @ManyToOne @JoinColumn(name = "lancamento_original_id", updatable = false)
    private LancamentoRazao lancamentoOriginal;
    @ManyToOne(optional = false) @JoinColumn(name = "usuario_responsavel_id", updatable = false)
    private Usuario usuarioResponsavel;
    @Column(nullable = false, unique = true, length = 128, updatable = false)
    private String chaveIdempotencia;
    @Column(nullable = false, length = 64, updatable = false)
    private String payloadHash;
    @Column(length = 500, updatable = false)
    private String observacao;
}
