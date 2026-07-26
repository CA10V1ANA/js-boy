package com.ravtec.delivery.controller;

import com.ravtec.delivery.entity.TipoSolicitacaoTitular;
import com.ravtec.delivery.service.LgpdService;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lgpd/clientes")
@PreAuthorize("hasRole('PROPRIETARIO')")
@RequiredArgsConstructor
public class LgpdController {
    private final LgpdService service;
    @GetMapping("/{id}/exportacao")
    public Map<String, Object> exportar(@PathVariable UUID id) { return service.exportar(id); }
    @PostMapping("/{id}/solicitacoes")
    public Map<String, UUID> registrar(
        @PathVariable UUID id, @RequestParam TipoSolicitacaoTitular tipo,
        @RequestParam(required = false) String justificativa
    ) { return Map.of("id", service.registrar(id, tipo, justificativa)); }
    @PostMapping("/{id}/anonimizacao")
    public void anonimizar(@PathVariable UUID id, @RequestParam String justificativa) {
        service.anonimizar(id, justificativa);
    }
}
