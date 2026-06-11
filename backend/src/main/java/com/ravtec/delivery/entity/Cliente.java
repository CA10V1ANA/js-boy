package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clientes")
public class Cliente extends BaseEntity {

    @Column(nullable = false, length = 140)
    private String nome;

    @Column(nullable = false, length = 30)
    private String telefone;

    @Column(length = 30)
    private String whatsapp;

    @Column(length = 180)
    private String email;

    @Column(length = 20)
    private String documento;

    @Column(nullable = false, length = 180)
    private String endereco;

    @Column(nullable = false, length = 80)
    private String bairro;

    @Column(nullable = false, length = 80)
    private String cidade;

    @Column(length = 500)
    private String observacoes;

    @Column(nullable = false)
    private boolean ativo = true;
}

