package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/operacao-entregador/entregas")
@PreAuthorize("hasAnyRole('ENTREGADOR', 'PROPRIETARIO')")
@RequiredArgsConstructor
public class OperacaoEntregadorController {

    private final ParadaEntregaService paradaService;
    private final OcorrenciaEntregaService ocorrenciaService;

    @GetMapping("/{entregaId}/paradas")
    public List<ParadaResponse> paradas(@PathVariable UUID entregaId) {
        return paradaService.listarOperacional(entregaId);
    }

    @PostMapping("/{entregaId}/paradas/{paradaId}/concluir")
    public ParadaResponse concluir(
        @PathVariable UUID entregaId,
        @PathVariable UUID paradaId,
        @RequestHeader(name = "If-Match", required = false) Long versao,
        @Valid @RequestBody(required = false) ConcluirParadaRequest dados
    ) {
        return paradaService.concluirOperacional(entregaId, paradaId, versao, dados);
    }

    @PostMapping("/{entregaId}/ocorrencias")
    public OcorrenciaResponse ocorrencia(
        @PathVariable UUID entregaId,
        @Valid @RequestBody OcorrenciaRequest request
    ) {
        return ocorrenciaService.registrar(entregaId, request);
    }
}
