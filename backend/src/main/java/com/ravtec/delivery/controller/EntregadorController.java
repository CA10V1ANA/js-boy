package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.EntregadorRequest;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.service.EntregadorService;
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
@RequestMapping("/entregadores")
@RequiredArgsConstructor
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
    public EntregadorResponse atualizar(@PathVariable UUID id, @Valid @RequestBody EntregadorRequest request) {
        return entregadorService.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public EntregadorResponse alterarStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return entregadorService.alterarStatus(id, request);
    }
}

