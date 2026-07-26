package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.CriarAcessoEntregadorRequest;
import com.ravtec.delivery.dto.EntregadorRequest;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.service.EntregadorService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/entregadores")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPRIETARIO')")
public class EntregadorController {
    private final EntregadorService entregadorService;
    @GetMapping
    public List<EntregadorResponse> listar(@RequestParam(required = false) String busca) {
        return entregadorService.listar(busca);
    }
    @GetMapping("/{id}")
    public EntregadorResponse consultar(@PathVariable UUID id) {
        return entregadorService.consultar(id);
    }
    @PostMapping
    public EntregadorResponse criar(@Valid @RequestBody EntregadorRequest request) {
        return entregadorService.criar(request);
    }
    @PutMapping("/{id}")
    public EntregadorResponse atualizar(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody EntregadorRequest request
    ) {
        return entregadorService.atualizar(id, request, versao);
    }
    @PatchMapping("/{id}/status")
    public EntregadorResponse alterarStatus(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody StatusRequest request
    ) {
        return entregadorService.alterarStatus(id, request, versao);
    }
    @PostMapping("/{id}/acesso")
    public EntregadorResponse criarAcesso(
        @PathVariable UUID id,
        @Valid @RequestBody CriarAcessoEntregadorRequest request
    ) {
        return entregadorService.criarAcesso(id, request);
    }
}
