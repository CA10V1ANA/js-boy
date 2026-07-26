package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "links_rastreamento")
public class LinkRastreamento extends BaseEntity {
    @ManyToOne(optional = false)
    @JoinColumn(name = "entrega_id")
    private Entrega entrega;
    @Column(nullable = false, unique = true, length = 24)
    private String codigoPublico;
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;
    private OffsetDateTime expiraEm;
    private OffsetDateTime revogadoEm;
    @Column(nullable = false)
    private long acessos;
    private OffsetDateTime ultimoAcessoEm;

    public boolean ativoEm(OffsetDateTime agora) {
        return revogadoEm == null && (expiraEm == null || expiraEm.isAfter(agora));
    }
}
