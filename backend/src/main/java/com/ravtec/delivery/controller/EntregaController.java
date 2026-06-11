package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.DesignarEntregadorRequest;
import com.ravtec.delivery.dto.EntregaRequest;
import com.ravtec.delivery.dto.EntregaResponse;
import com.ravtec.delivery.dto.EntregaStatusRequest;
import com.ravtec.delivery.service.EntregaService;
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
@RequestMapping("/entregas")
@RequiredArgsConstructor
public class EntregaController {

    private final EntregaService entregaService;

    @GetMapping
    public List<EntregaResponse> listar(@RequestParam(required = false) String busca) {
        return entregaService.listar(busca);
    }

    @GetMapping("/{id}")
    public EntregaResponse consultar(@PathVariable UUID id) {
        return entregaService.consultar(id);
    }

    @PostMapping
    public EntregaResponse criar(@Valid @RequestBody EntregaRequest request) {
        return entregaService.criar(request);
    }

    @PutMapping("/{id}")
    public EntregaResponse atualizar(@PathVariable UUID id, @Valid @RequestBody EntregaRequest request) {
        return entregaService.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public EntregaResponse alterarStatus(@PathVariable UUID id, @Valid @RequestBody EntregaStatusRequest request) {
        return entregaService.alterarStatus(id, request);
    }

    @PatchMapping("/{id}/entregador")
    public EntregaResponse designarEntregador(@PathVariable UUID id, @Valid @RequestBody DesignarEntregadorRequest request) {
        return entregaService.designarEntregador(id, request);
    }
}
