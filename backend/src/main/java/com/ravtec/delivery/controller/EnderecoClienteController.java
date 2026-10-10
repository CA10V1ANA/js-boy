package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.EnderecoClienteDto.*;
import com.ravtec.delivery.service.EnderecoClienteService;
import jakarta.validation.Valid;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cliente/enderecos")
@PreAuthorize("hasRole('CLIENTE')")
@RequiredArgsConstructor
public class EnderecoClienteController {

    private final EnderecoClienteService service;

    @GetMapping
    public List<Registro> listar() {
        return service.listar();
    }

    @PostMapping
    public Map<String, UUID> criar(@Valid @RequestBody Dados d) {
        return Map.of("id", service.salvar(null, null, d));
    }

    @PutMapping("/{id}")
    public Map<String, UUID> editar(
        @PathVariable UUID id,
        @RequestHeader("If-Match") Long versao,
        @Valid @RequestBody Dados d
    ) {
        return Map.of("id", service.salvar(id, versao, d));
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable UUID id, @RequestHeader("If-Match") Long versao) {
        service.excluir(id, versao);
    }
}
