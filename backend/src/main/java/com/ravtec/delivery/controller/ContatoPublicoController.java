package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ContatoPublicoRequest;
import com.ravtec.delivery.dto.ContatoPublicoResponse;
import com.ravtec.delivery.service.SolicitacaoContatoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/contatos")
@RequiredArgsConstructor
public class ContatoPublicoController {

    private final SolicitacaoContatoService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContatoPublicoResponse registrar(
        @Valid @RequestBody ContatoPublicoRequest request,
        HttpServletRequest servletRequest
    ) {
        return service.registrar(request, servletRequest.getRemoteAddr());
    }
}
