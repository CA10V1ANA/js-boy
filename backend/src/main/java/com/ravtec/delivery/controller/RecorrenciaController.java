package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.RecorrenciaEntregaService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/recorrencias")
@PreAuthorize("hasRole('PROPRIETARIO')")
@RequiredArgsConstructor
public class RecorrenciaController {
    private final RecorrenciaEntregaService service;

    @PostMapping
    public RecorrenciaResponse criar(@Valid @RequestBody RecorrenciaRequest request) {
        return service.criar(request);
    }

    @PostMapping("/gerar")
    public Map<String, Integer> gerar(@RequestParam LocalDate ate) {
        return Map.of("geradas", service.gerarAte(ate));
    }

    @PatchMapping("/{id}/ativa")
    public RecorrenciaResponse ativa(@PathVariable UUID id, @RequestParam boolean ativa) {
        return service.alterarAtiva(id, ativa);
    }
}
