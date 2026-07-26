package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.SolicitacaoContatoResponse;
import com.ravtec.delivery.dto.SolicitacaoContatoStatusRequest;
import com.ravtec.delivery.entity.StatusSolicitacaoContato;
import com.ravtec.delivery.service.SolicitacaoContatoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/contatos")
@RequiredArgsConstructor
public class SolicitacaoContatoController {

    private final SolicitacaoContatoService service;

    @GetMapping
    public List<SolicitacaoContatoResponse> listar(
        @RequestParam(required = false) StatusSolicitacaoContato status
    ) {
        return service.listar(status);
    }

    @PatchMapping("/{id}/status")
    public SolicitacaoContatoResponse alterarStatus(
        @PathVariable UUID id,
        @Valid @RequestBody SolicitacaoContatoStatusRequest request
    ) {
        return service.alterarStatus(id, request.status());
    }
}
