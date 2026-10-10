package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.RecebimentoService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/operacao-entregador/recebimentos")
@PreAuthorize("hasAnyRole('ENTREGADOR', 'PROPRIETARIO')")
@RequiredArgsConstructor
public class RecebimentoOperacionalController {

    private final RecebimentoService service;

    @GetMapping("/{id}")
    public RecebimentoResponse consultar(@PathVariable UUID id) {
        return service.consultarOperacional(id);
    }

    @PostMapping("/{id}/confirmar")
    public PagamentoResponse confirmar(
        @PathVariable UUID id,
        @RequestHeader("Idempotency-Key") String chave,
        @Valid @RequestBody ConfirmarRecebimentoRequest request
    ) {
        return service.confirmarOperacional(id, chave, request);
    }
}
