package com.ravtec.delivery.repository;

import com.ravtec.delivery.entity.Pagamento;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PagamentoRepository extends JpaRepository<Pagamento, UUID> {
    List<Pagamento> findByEntregaId(UUID entregaId);

    @Query("select coalesce(sum(p.valor), 0) from Pagamento p")
    BigDecimal somarPagamentos();
}
