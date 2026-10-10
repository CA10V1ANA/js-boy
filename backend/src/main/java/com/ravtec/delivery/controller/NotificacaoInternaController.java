package com.ravtec.delivery.controller;

import com.ravtec.delivery.service.NotificacaoInternaService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/notificacoes", "/operacao-entregador/notificacoes" })
@RequiredArgsConstructor
public class NotificacaoInternaController {

    private final NotificacaoInternaService service;

    @GetMapping("/nao-lidas")
    public Map<String, Long> contar(HttpServletRequest r) {
        return Map.of("total", service.contar(r.getServletPath().startsWith("/operacao-entregador/")));
    }

    @GetMapping
    public List<NotificacaoInternaService.Aviso> listar(
        HttpServletRequest r,
        @RequestParam(defaultValue = "false") boolean naoLidas,
        @RequestParam(defaultValue = "0") int pagina
    ) {
        return service.listar(r.getServletPath().startsWith("/operacao-entregador/"), naoLidas, pagina);
    }

    @PatchMapping("/{id}/leitura")
    public void ler(HttpServletRequest r, @PathVariable UUID id) {
        service.ler(id, r.getServletPath().startsWith("/operacao-entregador/"));
    }
}
