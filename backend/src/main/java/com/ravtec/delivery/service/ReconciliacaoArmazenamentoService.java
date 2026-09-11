package com.ravtec.delivery.service;

import com.ravtec.delivery.repository.ComprovanteEntregaRepository;
import java.util.HashSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReconciliacaoArmazenamentoService {
    private final ComprovanteEntregaRepository repository;
    private final ArmazenamentoArquivo armazenamento;

    @Scheduled(cron = "${app.storage.reconciliation-cron:0 41 3 * * *}")
    @Transactional(readOnly = true)
    public void reconciliar() {
        var referenciadas = new HashSet<>(repository.findAllStorageKeys());
        int orfas = 0;
        for (var chave : armazenamento.listarChaves()) {
            if (!referenciadas.contains(chave)) {
                // An uncommitted upload may already exist on disk. Reconciliation
                // reports candidates; deletion requires an independent retention workflow.
                orfas++;
            }
        }
        long ausentes = referenciadas.stream().filter(chave -> !armazenamento.existe(chave)).count();
        if (orfas > 0 || ausentes > 0) {
            log.warn("proof_storage_reconciliation orphan_candidates={} missing_references={}", orfas, ausentes);
        }
    }
}
