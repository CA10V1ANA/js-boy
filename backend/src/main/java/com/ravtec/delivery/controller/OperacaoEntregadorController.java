package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.TipoComprovante;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/operacao-entregador/entregas")
@PreAuthorize("hasRole('ENTREGADOR')")
@RequiredArgsConstructor
public class OperacaoEntregadorController {
    private final ParadaEntregaService paradaService;
    private final ComprovanteService comprovanteService;
    private final OcorrenciaEntregaService ocorrenciaService;

    @GetMapping("/{entregaId}/paradas")
    public List<ParadaResponse> paradas(@PathVariable UUID entregaId) {
        return paradaService.listar(entregaId);
    }

    @PostMapping("/{entregaId}/paradas/{paradaId}/concluir")
    public ParadaResponse concluir(
        @PathVariable UUID entregaId, @PathVariable UUID paradaId,
        @RequestHeader(name = "If-Match", required = false) Long versao
    ) {
        return paradaService.concluirMinhaParada(entregaId, paradaId, versao);
    }

    @PostMapping(value = "/{entregaId}/comprovantes", consumes = "multipart/form-data")
    public ComprovanteResponse comprovante(
        @PathVariable UUID entregaId,
        @RequestParam(required = false) UUID paradaId,
        @RequestParam TipoComprovante tipo,
        @RequestHeader("Idempotency-Key") String chaveIdempotencia,
        @RequestPart(required = false) MultipartFile arquivo,
        @RequestParam(required = false) String recebedorNome,
        @RequestParam(required = false) String assinatura,
        @RequestParam(required = false) String otp,
        @RequestParam(required = false) BigDecimal latitude,
        @RequestParam(required = false) BigDecimal longitude,
        @RequestParam(defaultValue = "false") boolean consentimentoLocalizacao,
        @RequestParam(required = false) String observacao
    ) {
        return comprovanteService.criar(entregaId, paradaId, tipo, chaveIdempotencia, arquivo, recebedorNome,
            assinatura, otp, latitude, longitude, consentimentoLocalizacao, observacao);
    }

    @PostMapping("/{entregaId}/ocorrencias")
    public OcorrenciaResponse ocorrencia(
        @PathVariable UUID entregaId, @Valid @RequestBody OcorrenciaRequest request
    ) {
        return ocorrenciaService.registrar(entregaId, request);
    }
}
