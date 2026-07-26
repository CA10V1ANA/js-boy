package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @Entity @Table(name = "solicitacoes_titular")
public class SolicitacaoTitular extends BaseEntity {
    @ManyToOne @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private TipoSolicitacaoTitular tipo;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private StatusSolicitacaoTitular status = StatusSolicitacaoTitular.REGISTRADA;
    @Column(nullable = false)
    private OffsetDateTime solicitadaEm = OffsetDateTime.now();
    private OffsetDateTime concluidaEm;
    @Column(length = 500)
    private String justificativa;
    @ManyToOne(optional = false) @JoinColumn(name = "usuario_responsavel_id")
    private Usuario usuarioResponsavel;
}
