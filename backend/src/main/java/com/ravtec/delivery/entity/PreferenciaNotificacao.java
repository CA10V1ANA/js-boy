package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "preferencias_notificacao")
public class PreferenciaNotificacao extends BaseEntity {
    @OneToOne(optional = false)
    @JoinColumn(name = "cliente_id", unique = true)
    private Cliente cliente;
    @Column(nullable = false)
    private boolean emailAtivo = true;
    @Column(nullable = false)
    private boolean whatsappAtivo;
    @Column(nullable = false)
    private boolean smsAtivo;
}
