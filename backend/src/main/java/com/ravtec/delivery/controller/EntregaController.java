package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.DesignarEntregadorRequest;
import com.ravtec.delivery.dto.EntregaOperacionalResponse;
import com.ravtec.delivery.dto.EntregaRequest;
import com.ravtec.delivery.dto.EntregaResponse;
import com.ravtec.delivery.dto.EntregaStatusRequest;
import com.ravtec.delivery.service.EntregaService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/entregas")
@RequiredArgsConstructor
public class EntregaController {
    private final EntregaService entregaService;

    @GetMapping
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public List<EntregaResponse> listar(@RequestParam(required = false) String busca) {
        return entregaService.listar(busca);
    }
    @GetMapping("/minhas-entregas")
    @PreAuthorize("hasRole('ENTREGADOR')")
    public List<EntregaOperacionalResponse> listarMinhasEntregas() {
        return entregaService.listarMinhasEntregas();
    }
    @GetMapping("/minhas-entregas/{id}")
    @PreAuthorize("hasRole('ENTREGADOR')")
    public EntregaOperacionalResponse consultarMinhaEntrega(@PathVariable UUID id) {
        return entregaService.consultarMinhaEntrega(id);
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public EntregaResponse consultar(@PathVariable UUID id) {
        return entregaService.consultar(id);
    }
    @PostMapping
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public EntregaResponse criar(@Valid @RequestBody EntregaRequest request) {
        return entregaService.criar(request);
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public EntregaResponse atualizar(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody EntregaRequest request
    ) {
        return entregaService.atualizar(id, request, versao);
    }
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public EntregaResponse alterarStatus(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody EntregaStatusRequest request
    ) {
        return entregaService.alterarStatus(id, request, versao);
    }
    @PatchMapping("/minhas-entregas/{id}/status")
    @PreAuthorize("hasRole('ENTREGADOR')")
    public EntregaOperacionalResponse alterarStatusMinhaEntrega(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody EntregaStatusRequest request
    ) {
        return entregaService.alterarStatusMinhaEntrega(id, request, versao);
    }
    @PatchMapping("/{id}/entregador")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public EntregaResponse designarEntregador(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody DesignarEntregadorRequest request
    ) {
        return entregaService.designarEntregador(id, request, versao);
    }
}
