package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "paradas_entrega", uniqueConstraints = @UniqueConstraint(columnNames = {"entrega_id", "ordem"}))
public class ParadaEntrega extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "entrega_id")
    private Entrega entrega;
    @Column(nullable = false)
    private Integer ordem;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoParada tipo;
    @Column(nullable = false, length = 180)
    private String logradouro;
    @Column(length = 30)
    private String numero;
    @Column(nullable = false)
    private boolean semNumero;
    @Column(length = 120)
    private String complemento;
    @Column(nullable = false, length = 80)
    private String bairro;
    @Column(length = 80)
    private String cidade;
    @Column(length = 2)
    private String estado;
    @Column(length = 8)
    private String cep;
    @Column(length = 140)
    private String contatoNome;
    @Column(length = 20)
    private String contatoTelefone;
    @Column(length = 500)
    private String observacao;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusParada status = StatusParada.PENDENTE;
    private OffsetDateTime previstaEm;
    private OffsetDateTime realizadaEm;
    @Version
    private Long version;
}
