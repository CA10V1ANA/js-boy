package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.dto.UsuarioResponse;
import com.ravtec.delivery.service.UsuarioService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROPRIETARIO')")
public class UsuarioController {
    private final UsuarioService usuarioService;

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @PatchMapping("/{id}/status")
    public UsuarioResponse alterarStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return usuarioService.alterarStatus(id, request);
    }
}
