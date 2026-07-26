package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.AuditoriaResponse;
import com.ravtec.delivery.service.AuditoriaService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auditorias")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPRIETARIO')")
public class AuditoriaController {
    private final AuditoriaService auditoriaService;

    @GetMapping
    public List<AuditoriaResponse> listar(
        @RequestParam(required = false) String entidade,
        @RequestParam(required = false) UUID usuarioId
    ) {
        return auditoriaService.listar(entidade, usuarioId);
    }
}
