package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.PixResponse;
import com.ravtec.delivery.service.PixService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pix")
@RequiredArgsConstructor
public class PixController {
    private final PixService pix;
    @PostMapping("/entregas/{entregaId}")
    public PixResponse gerar(@PathVariable UUID entregaId) { return pix.gerar(entregaId); }
    @GetMapping("/{id}")
    public PixResponse consultar(@PathVariable UUID id) { return pix.consultar(id); }
}
