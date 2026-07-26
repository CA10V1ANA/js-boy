package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ConfiguracaoEmpresaResponse;
import com.ravtec.delivery.service.ConfiguracaoEmpresaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cliente/contato")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class ClienteContatoController {
    private final ConfiguracaoEmpresaService service;

    @GetMapping
    public ConfiguracaoEmpresaResponse consultar() {
        return service.consultar();
    }
}
