package com.ravtec.delivery.repository;
import com.ravtec.delivery.entity.LancamentoRazao;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface LancamentoRazaoRepository extends JpaRepository<LancamentoRazao, UUID> {
    Optional<LancamentoRazao> findByChaveIdempotencia(String chave);
    List<LancamentoRazao> findByCompetenciaBetweenOrderByOcorridoEm(LocalDate inicio, LocalDate fim);
}
