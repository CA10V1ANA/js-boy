package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.EntregaOperacionalResponse;
import com.ravtec.delivery.dto.EntregaStatusRequest;
import com.ravtec.delivery.service.SincronizacaoOfflineService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/operacao-entregador/offline")
@PreAuthorize("hasRole('ENTREGADOR')")
@RequiredArgsConstructor
public class SincronizacaoOfflineController {
    private final SincronizacaoOfflineService service;

    @PostMapping("/entregas/{entregaId}/status")
    public EntregaOperacionalResponse status(
        @PathVariable UUID entregaId,
        @RequestHeader("Idempotency-Key") String chave,
        @Valid @RequestBody EntregaStatusRequest request
    ) {
        return service.alterarStatus(entregaId, request, chave);
    }
}
