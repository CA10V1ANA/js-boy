package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.PagamentoResponse;
import com.ravtec.delivery.service.PagamentoService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cliente/pagamentos")
@RequiredArgsConstructor
public class ClientePagamentoController {

    private final PagamentoService pagamentoService;

    @GetMapping
    public List<PagamentoResponse> listar() {
        return pagamentoService.listarDoClienteAtual();
    }
}
