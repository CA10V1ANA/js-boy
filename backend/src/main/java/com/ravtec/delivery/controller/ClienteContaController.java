package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.PerfilClienteRequest;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cliente/me")
@PreAuthorize("hasRole('CLIENTE')")
@RequiredArgsConstructor
public class ClienteContaController {

    private final PerfilContaService perfis;

    public record Email(@NotBlank @jakarta.validation.constraints.Email @Size(max = 180) String email) {}

    @PatchMapping
    public ClienteResponse atualizar(
        @Valid @RequestBody PerfilClienteRequest dados,
        @RequestHeader(name = "If-Match", required = false) Long versao
    ) {
        return perfis.atualizarCliente(dados, versao);
    }

    @PostMapping("/email")
    public void email(@Valid @RequestBody Email dados) {
        perfis.atualizarCliente(PerfilClienteRequest.paraEmail(dados.email()), null);
    }
}
