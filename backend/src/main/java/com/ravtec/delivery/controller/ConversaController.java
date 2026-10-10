package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ConversaDto.*;
import com.ravtec.delivery.service.ConversaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/conversas", "/operacao-entregador/conversas" })
@PreAuthorize("hasAnyRole('CLIENTE','ENTREGADOR','PROPRIETARIO')")
@RequiredArgsConstructor
public class ConversaController {

    private final ConversaService service;

    private boolean operacional(HttpServletRequest r) {
        return r.getServletPath().startsWith("/operacao-entregador/");
    }

    @GetMapping
    public List<Resumo> listar(
        HttpServletRequest r,
        @RequestParam(defaultValue = "") String busca,
        @RequestParam(defaultValue = "false") boolean naoLidas,
        @RequestParam(defaultValue = "0") int pagina
    ) {
        return service.listar(operacional(r), busca, naoLidas, pagina);
    }

    @GetMapping("/nao-lidas")
    public Map<String, Long> naoLidas(HttpServletRequest r) {
        return Map.of("total", service.naoLidas(operacional(r)));
    }

    @PostMapping("/entregas/{entregaId}")
    public Detalhe abrir(HttpServletRequest r, @PathVariable UUID entregaId) {
        return service.abrir(entregaId, operacional(r));
    }

    @GetMapping("/{id}")
    public Detalhe consultar(HttpServletRequest r, @PathVariable UUID id) {
        return service.consultar(id, operacional(r));
    }

    @GetMapping("/{id}/mensagens")
    public List<Mensagem> mensagens(
        HttpServletRequest r,
        @PathVariable UUID id,
        @RequestParam(required = false) Long apos,
        @RequestParam(required = false) Long antes
    ) {
        return service.mensagens(id, operacional(r), apos, antes);
    }

    @PostMapping("/{id}/mensagens")
    public Mensagem enviar(HttpServletRequest r, @PathVariable UUID id, @Valid @RequestBody Envio envio) {
        return service.enviar(id, operacional(r), envio);
    }

    @PatchMapping("/{id}/leitura")
    public void ler(HttpServletRequest r, @PathVariable UUID id, @Valid @RequestBody Leitura leitura) {
        service.ler(id, operacional(r), leitura.sequencia());
    }

    @PostMapping("/{id}/reabrir")
    @PreAuthorize("hasRole('PROPRIETARIO')")
    public void reabrir(HttpServletRequest r, @PathVariable UUID id, @Valid @RequestBody Reabertura request) {
        if (operacional(r)) throw new org.springframework.security.access.AccessDeniedException(
            "Use o modo proprietário"
        );
        service.reabrir(id, request);
    }
}
