package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.RecebimentoService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/recebimentos/entregas")
@RequiredArgsConstructor
public class RecebimentoController {
    private final RecebimentoService service;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETARIO', 'ENTREGADOR', 'CLIENTE')")
    public RecebimentoResponse consultar(@PathVariable UUID id) { return service.consultar(id); }

    @PostMapping("/{id}/confirmar")
    @PreAuthorize("hasAnyRole('PROPRIETARIO', 'ENTREGADOR')")
    public PagamentoResponse confirmar(@PathVariable UUID id, @RequestHeader("Idempotency-Key") String chave,
        @Valid @RequestBody ConfirmarRecebimentoRequest request) { return service.confirmar(id, chave, request); }
}
