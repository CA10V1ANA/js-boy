package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ResumoEntregadorResponse;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.entity.TipoComprovante;
import com.ravtec.delivery.repository.ComprovanteEntregaRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumSet;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PainelEntregadorService {
    private static final ZoneId FUSO_OPERACAO = ZoneId.of("America/Fortaleza");
    private static final EnumSet<StatusEntrega> STATUS_FINAIS = EnumSet.of(
        StatusEntrega.ENTREGUE,
        StatusEntrega.DEVOLVIDA,
        StatusEntrega.FALHA_OPERACIONAL,
        StatusEntrega.CANCELADA
    );

    private final EntregaRepository entregaRepository;
    private final ComprovanteEntregaRepository comprovanteRepository;
    private final IdentidadeAtual identidadeAtual;

    @Transactional(readOnly = true)
    public ResumoEntregadorResponse resumoHoje() {
        identidadeAtual.entregadorObrigatorio();
        var entregas = entregaRepository.findByEntregadorUsuarioIdOrderByCriadoEmDesc(
            identidadeAtual.principal().getId());
        var hoje = LocalDate.now(FUSO_OPERACAO);

        long ativas = entregas.stream().filter(entrega -> !STATUS_FINAIS.contains(entrega.getStatus())).count();
        long emRota = entregas.stream().filter(entrega -> EnumSet.of(
            StatusEntrega.COLETADA, StatusEntrega.EM_ROTA, StatusEntrega.EM_DEVOLUCAO
        ).contains(entrega.getStatus())).count();
        var concluidasHoje = entregas.stream()
            .filter(entrega -> entrega.getStatus() == StatusEntrega.ENTREGUE)
            .filter(entrega -> entrega.getConcluidaEm() != null)
            .filter(entrega -> entrega.getConcluidaEm().atZoneSameInstant(FUSO_OPERACAO).toLocalDate().equals(hoje))
            .toList();
        var valorHoje = concluidasHoje.stream()
            .map(entrega -> entrega.getValorFinal() == null ? BigDecimal.ZERO : entrega.getValorFinal())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        long documentacaoPendente = entregas.stream().filter(entrega -> {
            if (entrega.getStatus() == StatusEntrega.COLETADA) {
                return !comprovanteRepository.existsByEntregaIdAndTipoAndSubstituidoPorIsNull(
                    entrega.getId(), TipoComprovante.COLETA);
            }
            if (entrega.getStatus() == StatusEntrega.EM_ROTA) {
                return !comprovanteRepository.existsByEntregaIdAndTipoAndSubstituidoPorIsNull(
                    entrega.getId(), TipoComprovante.ENTREGA);
            }
            return false;
        }).count();

        return new ResumoEntregadorResponse(
            ativas, emRota, concluidasHoje.size(), valorHoje, documentacaoPendente
        );
    }
}
