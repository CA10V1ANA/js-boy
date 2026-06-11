package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "entregadores")
public class Entregador extends BaseEntity {

    @Column(nullable = false, length = 140)
    private String nome;

    @Column(nullable = false, unique = true, length = 20)
    private String cpf;

    @Column(nullable = false, length = 30)
    private String telefone;

    @Column(length = 180)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoVeiculo tipoVeiculo = TipoVeiculo.MOTO;

    @Column(length = 12)
    private String placaVeiculo;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false)
    private boolean disponivel = true;

    @OneToOne
    private Usuario usuario;
}

