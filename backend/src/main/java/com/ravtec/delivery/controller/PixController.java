package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.PixResponse;
import com.ravtec.delivery.service.PixService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pix")
@RequiredArgsConstructor
public class PixController {
    private final PixService pix;
    @GetMapping("/{id}")
    public PixResponse consultar(@PathVariable UUID id) { return pix.consultar(id); }
    public record ConciliacaoRequest(@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Positive Long transacaoId) {}

    @PostMapping("/{id}/conciliar")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('PROPRIETARIO')")
    public PixResponse conciliar(@PathVariable UUID id, @jakarta.validation.Valid @RequestBody ConciliacaoRequest request) {
        return pix.conciliar(id, request.transacaoId());
    }
}
