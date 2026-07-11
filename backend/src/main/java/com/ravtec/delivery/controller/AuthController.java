package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.LoginRequest;
import com.ravtec.delivery.dto.LoginResponse;
import com.ravtec.delivery.dto.UsuarioAutenticadoResponse;
import com.ravtec.delivery.security.JwtService;
import com.ravtec.delivery.security.UsuarioPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        var authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        var principal = (UsuarioPrincipal) authentication.getPrincipal();
        var usuario = principal.getUsuario();
        log.info("Login efetuado com sucesso: usuario={} perfil={}", usuario.getEmail(), usuario.getPerfil());

        return new LoginResponse(
            jwtService.gerarToken(principal),
            UsuarioAutenticadoResponse.from(usuario)
        );
    }

    @GetMapping("/me")
    public UsuarioAutenticadoResponse me(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return UsuarioAutenticadoResponse.from(principal.getUsuario());
    }
}

