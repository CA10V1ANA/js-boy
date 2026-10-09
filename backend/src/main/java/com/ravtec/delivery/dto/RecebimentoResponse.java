package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.FormaPagamento;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RecebimentoResponse(
    FormaPagamento formaPagamento, BigDecimal valorRecebido, BigDecimal saldo,
    UUID recebedorId, String recebedorNome, String chavePix, String titularPix,
    String referenciaRecebedor, boolean recebidoConfirmado, boolean podeConfirmar,
    boolean podeFinalizar, String pendencia, String confirmadoPor, OffsetDateTime confirmadoEm,
    UUID cobrancaLegadaId, Long transacaoLegadaId
) {}
