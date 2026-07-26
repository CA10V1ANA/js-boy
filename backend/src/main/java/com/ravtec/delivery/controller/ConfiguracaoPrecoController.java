package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.ConfiguracaoPrecoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/configuracoes/preco")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPRIETARIO')")
public class ConfiguracaoPrecoController {
    private final ConfiguracaoPrecoService configuracaoPrecoService;
    @GetMapping
    public ConfiguracaoPrecoResponse consultar() {
        return configuracaoPrecoService.consultar();
    }
    @PutMapping
    public ConfiguracaoPrecoResponse atualizar(
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody ConfiguracaoPrecoRequest request
    ) {
        return configuracaoPrecoService.atualizar(request, versao);
    }
    @PostMapping("/simular")
    public SimulacaoPrecoResponse simular(@Valid @RequestBody SimulacaoPrecoRequest request) {
        return configuracaoPrecoService.simular(request);
    }
}
