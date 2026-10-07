package com.ravtec.delivery.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "cobrancas_pix")
public class CobrancaPix extends BaseEntity {
    @ManyToOne(optional = false) private Entrega entrega;
    @ManyToOne(optional = false) private Usuario solicitante;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal valor;
    @Column(nullable = false, length = 180) private String emailPagador;
    @Column(unique = true) private Long mercadoPagoId;
    @Column(nullable = false, length = 30) private String status = "PENDENTE";
    @Column(columnDefinition = "text") private String qrCodeBase64;
    @Column(name = "qr_code_copia_e_cola", columnDefinition = "text") private String qrCodeCopiaECola;
    private OffsetDateTime expiraEm;
    @OneToOne private Pagamento pagamento;
}
