package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.ParadaEntregaService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rotas/entregas")
@RequiredArgsConstructor
public class RotaEntregaController {
    private final ParadaEntregaService service;
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETARIO', 'ENTREGADOR', 'CLIENTE')")
    public List<ParadaResponse> listar(@PathVariable UUID id) { return service.listar(id); }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public List<ParadaResponse> editar(@PathVariable UUID id, @RequestHeader("If-Match") Long versao,
        @Valid @RequestBody EditarRotaRequest request) { return service.editar(id, versao, request); }

    @PostMapping("/{id}/paradas/{paradaId}/concluir")
    @PreAuthorize("hasAnyRole('PROPRIETARIO', 'ENTREGADOR')")
    public ParadaResponse concluir(@PathVariable UUID id, @PathVariable UUID paradaId,
        @RequestHeader("If-Match") Long versao, @Valid @RequestBody(required = false) ConcluirParadaRequest dados) {
        return service.concluirMinhaParada(id, paradaId, versao, dados);
    }
}
