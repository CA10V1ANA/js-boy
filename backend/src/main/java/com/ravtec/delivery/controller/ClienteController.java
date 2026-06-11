package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.service.ClienteService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
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
    public ClienteResponse atualizar(@PathVariable UUID id, @Valid @RequestBody ClienteRequest request) {
        return clienteService.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public ClienteResponse alterarStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return clienteService.alterarStatus(id, request);
    }
}

