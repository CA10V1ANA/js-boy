package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.ResumoEntregadorResponse;
import com.ravtec.delivery.service.ClienteService;
import com.ravtec.delivery.service.PainelEntregadorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/operacao-entregador")
@PreAuthorize("hasRole('ENTREGADOR')")
@RequiredArgsConstructor
public class PainelEntregadorController {
    private final PainelEntregadorService painelEntregadorService;
    private final ClienteService clienteService;

    @GetMapping("/resumo")
    public ResumoEntregadorResponse resumo() {
        return painelEntregadorService.resumoHoje();
    }

    @PostMapping("/clientes")
    public ClienteResponse cadastrarCliente(@Valid @RequestBody ClienteRequest request) {
        return clienteService.criar(request);
    }
}
