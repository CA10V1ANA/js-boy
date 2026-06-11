package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ConfiguracaoPrecoRequest;
import com.ravtec.delivery.dto.ConfiguracaoPrecoResponse;
import com.ravtec.delivery.dto.SimulacaoPrecoRequest;
import com.ravtec.delivery.dto.SimulacaoPrecoResponse;
import com.ravtec.delivery.service.ConfiguracaoPrecoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/configuracoes/preco")
@RequiredArgsConstructor
public class ConfiguracaoPrecoController {

    private final ConfiguracaoPrecoService configuracaoPrecoService;

    @GetMapping
    public ConfiguracaoPrecoResponse consultar() {
        return configuracaoPrecoService.consultar();
    }

    @PutMapping
    public ConfiguracaoPrecoResponse atualizar(@Valid @RequestBody ConfiguracaoPrecoRequest request) {
        return configuracaoPrecoService.atualizar(request);
    }

    @PostMapping("/simular")
    public SimulacaoPrecoResponse simular(@Valid @RequestBody SimulacaoPrecoRequest request) {
        return configuracaoPrecoService.simular(request);
    }
}
