package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.PagamentoRequest;
import com.ravtec.delivery.dto.PagamentoResponse;
import com.ravtec.delivery.dto.RelatorioFinanceiroResponse;
import com.ravtec.delivery.service.PagamentoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pagamentos")
@RequiredArgsConstructor
public class PagamentoController {

    private final PagamentoService pagamentoService;

    @GetMapping
    public List<PagamentoResponse> listar() {
        return pagamentoService.listar();
    }

    @PostMapping
    public PagamentoResponse registrar(@Valid @RequestBody PagamentoRequest request) {
        return pagamentoService.registrar(request);
    }

    @GetMapping("/relatorio")
    public RelatorioFinanceiroResponse relatorio() {
        return pagamentoService.relatorio();
    }

    @GetMapping("/entrega/{entregaId}")
    public List<PagamentoResponse> listarPorEntrega(@PathVariable UUID entregaId) {
        return pagamentoService.listarPorEntrega(entregaId);
    }
}
