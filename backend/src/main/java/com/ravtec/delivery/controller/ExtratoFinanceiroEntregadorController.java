package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ExtratoMensalEntregadorResponse;
import com.ravtec.delivery.service.RazaoFinanceiraService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/operacao-entregador/financeiro")
@PreAuthorize("hasAnyRole('ENTREGADOR', 'FUNCIONARIO', 'PROPRIETARIO')")
@RequiredArgsConstructor
public class ExtratoFinanceiroEntregadorController {

    private final RazaoFinanceiraService service;

    @GetMapping("/extrato")
    public ExtratoMensalEntregadorResponse extrato(
        @RequestParam LocalDate inicio,
        @RequestParam LocalDate fim
    ) {
        return service.extratoEntregador(inicio, fim);
    }
}
