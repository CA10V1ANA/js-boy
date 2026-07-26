package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Pagamento;
import com.ravtec.delivery.entity.TipoLancamentoFinanceiro;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PagamentoRepository extends JpaRepository<Pagamento, UUID> {
    List<Pagamento> findByEntregaId(UUID entregaId);

    List<Pagamento> findByEntregaClienteUsuarioIdOrderByPagoEmDesc(UUID usuarioId);

    Optional<Pagamento> findByIdempotencyKey(String idempotencyKey);

    @Query("""
        select coalesce(sum(
            case when p.tipo = com.ravtec.delivery.entity.TipoLancamentoFinanceiro.RECEBIMENTO
                then p.valor else -p.valor end
        ), 0)
        from Pagamento p
        where p.entrega.id = :entregaId
        """)
    BigDecimal somarSaldoPorEntrega(UUID entregaId);

    @Query("""
        select coalesce(sum(p.valor), 0)
        from Pagamento p
        where p.lancamentoOriginal.id = :originalId
          and p.tipo = com.ravtec.delivery.entity.TipoLancamentoFinanceiro.ESTORNO
        """)
    BigDecimal somarEstornosDoLancamento(UUID originalId);

    @Query("""
        select coalesce(sum(
            case when p.tipo = com.ravtec.delivery.entity.TipoLancamentoFinanceiro.RECEBIMENTO
                then p.valor else -p.valor end
        ), 0)
        from Pagamento p
        """)
    BigDecimal somarSaldoFinanceiro();

    long countByTipo(TipoLancamentoFinanceiro tipo);
}
