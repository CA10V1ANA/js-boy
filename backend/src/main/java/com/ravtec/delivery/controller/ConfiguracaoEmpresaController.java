package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ConfiguracaoEmpresaRequest;
import com.ravtec.delivery.dto.ConfiguracaoEmpresaResponse;
import com.ravtec.delivery.service.ConfiguracaoEmpresaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/configuracoes/empresa")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPRIETARIO')")
public class ConfiguracaoEmpresaController {
    private final ConfiguracaoEmpresaService service;

    @GetMapping
    public ConfiguracaoEmpresaResponse consultar() {
        return service.consultar();
    }

    @PutMapping
    public ConfiguracaoEmpresaResponse atualizar(
        @RequestHeader(value = "If-Match", required = false) Long versao,
        @Valid @RequestBody ConfiguracaoEmpresaRequest request
    ) {
        return service.atualizar(versao, request);
    }
}
