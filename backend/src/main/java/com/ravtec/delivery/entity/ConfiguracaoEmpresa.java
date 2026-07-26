package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "configuracoes_empresa")
public class ConfiguracaoEmpresa extends BaseEntity {
    @Column(nullable = false, length = 140)
    private String nomeFantasia;
    @Column(length = 15)
    private String telefone;
    @Column(length = 15)
    private String whatsapp;
    @Column(length = 180)
    private String email;
    @Column(length = 8)
    private String cep;
    @Column(length = 180)
    private String logradouro;
    @Column(length = 20)
    private String numero;
    @Column(length = 120)
    private String complemento;
    @Column(length = 80)
    private String bairro;
    @Column(length = 80)
    private String cidade;
    @Column(length = 2)
    private String estado;
    @Column(length = 180)
    private String horarioAtendimento;
    @Version
    private Long version;
}
