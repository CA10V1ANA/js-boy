package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class RastreamentoController {
    private final RastreamentoService service;
    private final RastreamentoRateLimitService rateLimitService;

    @PostMapping("/entregas/{entregaId}/rastreamentos")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public LinkRastreamentoResponse criar(
        @PathVariable UUID entregaId,
        @RequestParam(required = false) OffsetDateTime expiraEm
    ) {
        return service.criar(entregaId, expiraEm);
    }

    @DeleteMapping("/entregas/{entregaId}/rastreamentos/{linkId}")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public void revogar(@PathVariable UUID entregaId, @PathVariable UUID linkId) {
        service.revogar(entregaId, linkId);
    }

    @GetMapping("/public/rastreamento/{token}")
    public RastreamentoPublicoResponse publico(@PathVariable String token, HttpServletRequest request) {
        rateLimitService.verificar(request.getRemoteAddr());
        return service.consultarPublico(token);
    }
}
