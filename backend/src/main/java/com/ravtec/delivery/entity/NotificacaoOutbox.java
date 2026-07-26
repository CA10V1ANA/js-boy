package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "notificacoes_outbox")
public class NotificacaoOutbox extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    @ManyToOne
    @JoinColumn(name = "entrega_id")
    private Entrega entrega;
    @Column(nullable = false, length = 50)
    private String evento;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CanalNotificacao canal;
    @Column(length = 180)
    private String destinoMascarado;
    @Column(nullable = false, length = 1000)
    private String payloadMinimo;
    @Column(nullable = false, unique = true, length = 180)
    private String chaveIdempotencia;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusNotificacao status = StatusNotificacao.PENDENTE;
    @Column(nullable = false)
    private int tentativas;
    private OffsetDateTime proximaTentativaEm;
    private OffsetDateTime processadaEm;
    @Column(length = 300)
    private String ultimoErro;
}
