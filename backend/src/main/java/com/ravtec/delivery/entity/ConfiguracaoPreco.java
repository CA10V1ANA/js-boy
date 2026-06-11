package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "configuracoes_preco")
public class ConfiguracaoPreco extends BaseEntity {

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxaInicial;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPorKm;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorMinimo;
}

