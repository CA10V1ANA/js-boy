package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.EntregaClienteResponse;
import com.ravtec.delivery.service.ClientePortalService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cliente")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENTE')")
public class ClientePortalController {

    private final ClientePortalService clientePortalService;

    @GetMapping("/me")
    public ClienteResponse meuCadastro() {
        return clientePortalService.meuCadastro();
    }

    @GetMapping("/entregas")
    public List<EntregaClienteResponse> minhasEntregas() {
        return clientePortalService.minhasEntregas();
    }

    @GetMapping("/entregas/{id}")
    public EntregaClienteResponse minhaEntrega(@PathVariable UUID id) {
        return clientePortalService.minhaEntrega(id);
    }
}
