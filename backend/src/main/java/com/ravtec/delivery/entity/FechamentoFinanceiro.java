package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Entity @Table(name = "fechamentos_financeiros")
public class FechamentoFinanceiro extends BaseEntity {
    @Column(nullable = false) private LocalDate inicio;
    @Column(nullable = false) private LocalDate fim;
    @Column(nullable = false) private OffsetDateTime fechadoEm;
    private OffsetDateTime reabertoEm;
    @Column(length = 500) private String motivoReabertura;
    @ManyToOne(optional = false) @JoinColumn(name = "usuario_fechamento_id")
    private Usuario usuarioFechamento;
    @ManyToOne @JoinColumn(name = "usuario_reabertura_id")
    private Usuario usuarioReabertura;
    @Version private Long version;
    public boolean fechado() { return reabertoEm == null; }
}
