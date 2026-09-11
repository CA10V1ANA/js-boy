package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.TravaFinanceira;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CoordenacaoFinanceiraService {
    private final EntityManager entityManager;

    // Serializes closing/reopening with financial writes, including empty periods.
    @Transactional(propagation = Propagation.MANDATORY)
    public void bloquear() {
        if (entityManager.find(TravaFinanceira.class, 1, LockModeType.PESSIMISTIC_WRITE) == null) {
            throw new IllegalStateException("Controle financeiro não inicializado");
        }
    }
}
