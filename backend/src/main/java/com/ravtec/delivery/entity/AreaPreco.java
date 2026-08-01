package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "areas_preco")
public class AreaPreco extends BaseEntity {
    @Column(nullable = false, unique = true, length = 30)
    private String codigo;
    @Column(nullable = false, length = 80)
    private String nome;
    @Column(nullable = false)
    private Integer ordem;
    @Column(precision = 10, scale = 2)
    private BigDecimal valorMoto;
    @Column(precision = 10, scale = 2)
    private BigDecimal valorCarro;
    @Column(nullable = false)
    private boolean valorNegociado;
    @Column(nullable = false)
    private boolean ativo = true;
    @OneToMany(mappedBy = "area", fetch = FetchType.LAZY)
    @OrderBy("nome asc")
    private List<BairroPreco> bairros = new ArrayList<>();
    @Version
    private Long version;
}
