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
@Table(name = "usuarios")
public class Usuario extends BaseEntity {

    @Column(nullable = false, length = 140)
    private String nome;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PerfilAcesso perfil;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false)
    private boolean emailVerificado = true;

    @Column(unique = true, length = 255)
    private String googleSub;

    @Column(nullable = false)
    private boolean senhaLocal = true;

    @OneToOne(mappedBy = "usuario")
    private Entregador entregador;

    @OneToOne(mappedBy = "usuario")
    private Cliente cliente;

    public PerfilAcesso getPerfilEfetivo() {
        if (perfil == PerfilAcesso.FUNCIONARIO && entregador != null) {
            return PerfilAcesso.ENTREGADOR;
        }
        return perfil;
    }

    public boolean isAcessoAtivo() {
        if (!ativo) return false;
        var efetivo = getPerfilEfetivo();
        if (efetivo == PerfilAcesso.CLIENTE) {
            return emailVerificado && cliente != null && cliente.isAtivo();
        }
        if (efetivo == PerfilAcesso.ENTREGADOR) {
            return entregador != null && entregador.isAtivo();
        }
        return true;
    }
}
