package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;
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
    @Column(nullable = false, length = 80)
    private String tabelaNome = "Tabela 2026";
    @Column(nullable = false)
    private LocalDate vigenteDesde = LocalDate.of(2026, 1, 1);
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxaRetorno = new BigDecimal("15.00");
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxaEsperaTrintaMinutos = new BigDecimal("15.00");
    @Version
    private Long version;
}
