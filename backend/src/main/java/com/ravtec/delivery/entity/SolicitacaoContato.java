package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "solicitacoes_contato")
public class SolicitacaoContato extends BaseEntity {

    @Column(nullable = false, length = 140, updatable = false)
    private String nome;

    @Column(length = 140, updatable = false)
    private String empresa;

    @Column(nullable = false, length = 180, updatable = false)
    private String email;

    @Column(nullable = false, length = 20, updatable = false)
    private String telefone;

    @Column(nullable = false, length = 2000, updatable = false)
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusSolicitacaoContato status = StatusSolicitacaoContato.NOVA;
}
