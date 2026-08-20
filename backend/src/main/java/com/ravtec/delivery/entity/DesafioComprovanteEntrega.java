package com.ravtec.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "desafios_comprovante_entrega")
public class DesafioComprovanteEntrega extends BaseEntity {
    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", nullable = false, unique = true)
    private Entrega entrega;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "parada_id", nullable = false)
    private ParadaEntrega parada;

    @Column(name = "codigo_hash", nullable = false, length = 64)
    private String codigoHash;

    @Column(name = "destino_mascarado", nullable = false, length = 40)
    private String destinoMascarado;

    @Column(name = "expira_em", nullable = false)
    private OffsetDateTime expiraEm;

    @Column(name = "ultimo_envio_em", nullable = false)
    private OffsetDateTime ultimoEnvioEm;

    @Column(name = "consumido_em")
    private OffsetDateTime consumidoEm;

    @Column(nullable = false)
    private int tentativas;

    @Version
    private Long version;

    public boolean ativo(OffsetDateTime agora) {
        return consumidoEm == null && expiraEm.isAfter(agora);
    }
}
