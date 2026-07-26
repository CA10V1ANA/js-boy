package com.ravtec.delivery.repository;
import com.ravtec.delivery.entity.FechamentoFinanceiro;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FechamentoFinanceiroRepository extends JpaRepository<FechamentoFinanceiro, UUID> {
    boolean existsByInicioLessThanEqualAndFimGreaterThanEqualAndReabertoEmIsNull(LocalDate data1, LocalDate data2);
    Optional<FechamentoFinanceiro> findByInicioAndFim(LocalDate inicio, LocalDate fim);
}
