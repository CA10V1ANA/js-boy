package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "pagamentos")
public class Pagamento extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Entrega entrega;

    @Column(nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, updatable = false)
    private FormaPagamento formaPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, updatable = false)
    private TipoLancamentoFinanceiro tipo = TipoLancamentoFinanceiro.RECEBIMENTO;

    @ManyToOne(fetch = FetchType.LAZY)
    private Pagamento lancamentoOriginal;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Usuario usuarioResponsavel;

    @Column(nullable = false, length = 128, unique = true, updatable = false)
    private String idempotencyKey;

    @Column(nullable = false, length = 64, updatable = false)
    private String payloadHash;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime pagoEm;

    @Column(length = 500, updatable = false)
    private String comprovante;

    @Column(length = 500, updatable = false)
    private String observacoes;

    @Column(length = 500, updatable = false)
    private String motivo;
}
