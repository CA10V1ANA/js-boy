package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cliente")
@PreAuthorize("hasRole('CLIENTE')")
@RequiredArgsConstructor
public class ClienteP2Controller {
    private final SolicitacaoEntregaClienteService solicitacaoService;
    private final ParadaEntregaService paradaService;
    private final ComprovanteService comprovanteService;
    private final OcorrenciaEntregaService ocorrenciaService;
    private final PreferenciaNotificacaoService preferenciaService;

    @PostMapping("/entregas")
    public EntregaClienteResponse solicitar(@Valid @RequestBody SolicitacaoEntregaClienteRequest request) {
        return solicitacaoService.solicitar(request);
    }

    @GetMapping("/entregas/{id}/paradas")
    public List<ParadaResponse> paradas(@PathVariable UUID id) {
        return paradaService.listar(id);
    }

    @GetMapping("/entregas/{id}/comprovantes")
    public List<ComprovanteResponse> comprovantes(@PathVariable UUID id) {
        return comprovanteService.listar(id);
    }

    @GetMapping("/entregas/{id}/ocorrencias")
    public List<OcorrenciaResponse> ocorrencias(@PathVariable UUID id) {
        return ocorrenciaService.listar(id);
    }

    @GetMapping("/notificacoes/preferencias")
    public PreferenciaNotificacaoResponse preferencias() {
        return preferenciaService.consultar();
    }

    @PutMapping("/notificacoes/preferencias")
    public PreferenciaNotificacaoResponse preferencias(
        @RequestBody PreferenciaNotificacaoRequest request
    ) {
        return preferenciaService.salvar(request);
    }
}
