package com.ravtec.delivery.controller;

import com.ravtec.delivery.entity.TipoSolicitacaoTitular;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.service.LgpdService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cliente/privacidade")
@PreAuthorize("hasRole('CLIENTE')")
@RequiredArgsConstructor
public class PrivacidadeClienteController {

    private final IdentidadeAtual identidade;
    private final LgpdService lgpd;

    public record Pedido(
        @NotNull TipoSolicitacaoTitular tipo,
        @NotBlank @Size(max = 500) String justificativa
    ) {}

    @GetMapping("/exportar")
    public Map<String, Object> exportar() {
        return lgpd.exportar(identidade.clienteObrigatorio().getId());
    }

    @PostMapping("/solicitacoes")
    public Map<String, UUID> solicitar(@Valid @RequestBody Pedido pedido) {
        return Map.of(
            "id",
            lgpd.registrar(identidade.clienteObrigatorio().getId(), pedido.tipo(), pedido.justificativa())
        );
    }
}
