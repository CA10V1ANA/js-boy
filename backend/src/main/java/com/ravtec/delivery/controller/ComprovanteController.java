package com.ravtec.delivery.controller;

import com.ravtec.delivery.service.ComprovanteService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comprovantes")
@RequiredArgsConstructor
public class ComprovanteController {
    private final ComprovanteService service;

    @GetMapping("/{entregaId}/{comprovanteId}/arquivo")
    public ResponseEntity<InputStreamResource> baixar(
        @PathVariable UUID entregaId, @PathVariable UUID comprovanteId
    ) {
        return service.baixar(entregaId, comprovanteId);
    }
}
