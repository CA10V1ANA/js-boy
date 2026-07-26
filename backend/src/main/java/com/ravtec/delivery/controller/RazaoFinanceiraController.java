package com.ravtec.delivery.controller;
import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.RazaoFinanceiraService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/financeiro")
@PreAuthorize("hasRole('PROPRIETARIO')")
@RequiredArgsConstructor
public class RazaoFinanceiraController {
    private final RazaoFinanceiraService service;
    @PostMapping("/lancamentos")
    public LancamentoRazaoResponse registrar(@RequestHeader("Idempotency-Key") String chave,
        @Valid @RequestBody LancamentoRazaoRequest request) { return service.registrar(chave, request); }
    @PostMapping("/fechamentos")
    public Map<String, UUID> fechar(@RequestParam LocalDate inicio, @RequestParam LocalDate fim) {
        return Map.of("id", service.fechar(inicio, fim));
    }
    @PostMapping("/fechamentos/{id}/reabrir")
    public void reabrir(@PathVariable UUID id, @RequestParam String motivo) { service.reabrir(id, motivo); }
    @GetMapping("/relatorio")
    public RelatorioRazaoResponse relatorio(@RequestParam LocalDate inicio, @RequestParam LocalDate fim) {
        return service.relatorio(inicio, fim);
    }
}
