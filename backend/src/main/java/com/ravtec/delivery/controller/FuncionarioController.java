package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.FuncionarioRequest;
import com.ravtec.delivery.dto.FuncionarioResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.service.FuncionarioService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/funcionarios")
@RequiredArgsConstructor
public class FuncionarioController {

    private final FuncionarioService funcionarioService;

    @GetMapping
    public List<FuncionarioResponse> listar() {
        return funcionarioService.listar();
    }

    @PostMapping
    public FuncionarioResponse criar(@Valid @RequestBody FuncionarioRequest request) {
        return funcionarioService.criar(request);
    }

    @PatchMapping("/{id}/status")
    public FuncionarioResponse alterarStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return funcionarioService.alterarStatus(id, request.ativo());
    }
}
