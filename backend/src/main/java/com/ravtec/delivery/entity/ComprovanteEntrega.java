package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "comprovantes_entrega")
public class ComprovanteEntrega extends BaseEntity {
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
    @Column(nullable = false, length = 30)
    private TipoComprovante tipo;
    @Column(length = 180)
    private String chaveIdempotencia;
    @Column(length = 255)
    private String storageKey;
    @Column(length = 80)
    private String mimeType;
    private Long tamanhoBytes;
    @Column(length = 64)
    private String sha256;
    @Column(length = 140)
    private String recebedorNome;
    @Column(length = 500)
    private String assinatura;
    @Column(length = 64)
    private String otpHash;
    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;
    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;
    @Column(nullable = false)
    private boolean localizacaoConsentida;
    @Column(length = 500)
    private String observacao;
    @ManyToOne
    @JoinColumn(name = "substituido_por_id")
    private ComprovanteEntrega substituidoPor;
}
