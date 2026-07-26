package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.CriarAcessoClienteRequest;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.service.ClienteService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPRIETARIO')")
public class ClienteController {
    private final ClienteService clienteService;
    @GetMapping
    public List<ClienteResponse> listar(@RequestParam(required = false) String busca) {
        return clienteService.listar(busca);
    }
    @GetMapping("/{id}")
    public ClienteResponse consultar(@PathVariable UUID id) {
        return clienteService.consultar(id);
    }
    @PostMapping
    public ClienteResponse criar(@Valid @RequestBody ClienteRequest request) {
        return clienteService.criar(request);
    }
    @PutMapping("/{id}")
    public ClienteResponse atualizar(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody ClienteRequest request
    ) {
        return clienteService.atualizar(id, request, versao);
    }
    @PatchMapping("/{id}/status")
    public ClienteResponse alterarStatus(
        @PathVariable UUID id,
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody StatusRequest request
    ) {
        return clienteService.alterarStatus(id, request, versao);
    }
    @PostMapping("/{id}/acesso")
    public ClienteResponse criarAcesso(@PathVariable UUID id, @Valid @RequestBody CriarAcessoClienteRequest request) {
        return clienteService.criarAcesso(id, request);
    }
}
