package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.PedidoClienteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cliente/entregas")
@PreAuthorize("hasRole('CLIENTE')")
@RequiredArgsConstructor
public class PedidoClienteController {

    private final PedidoClienteService pedidos;

    public record Cancelamento(@NotBlank @Size(max = 500) String motivo) {}

    @GetMapping("/{id}/edicao")
    public PedidoClienteService.Edicao edicao(@PathVariable UUID id) {
        return pedidos.consultar(id);
    }

    @PutMapping("/{id}")
    public EntregaClienteResponse editar(
        @PathVariable UUID id,
        @RequestHeader("If-Match") Long versao,
        @Valid @RequestBody SolicitacaoEntregaClienteRequest r
    ) {
        return pedidos.editar(id, versao, r);
    }

    @GetMapping("/{id}/cancelamento")
    public java.util.Map<String, Long> cancelamento(@PathVariable UUID id) {
        return java.util.Map.of("versao", pedidos.versaoCancelamento(id));
    }

    @PostMapping("/{id}/cancelar")
    public void cancelar(
        @PathVariable UUID id,
        @RequestHeader("If-Match") Long versao,
        @Valid @RequestBody Cancelamento r
    ) {
        pedidos.cancelar(id, versao, r.motivo());
    }
}
