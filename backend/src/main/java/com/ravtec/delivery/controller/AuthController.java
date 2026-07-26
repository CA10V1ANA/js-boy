package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.security.UsuarioPrincipal;
import com.ravtec.delivery.service.*;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final TentativaLoginService tentativaLoginService;
    private final RecuperacaoSenhaService recuperacaoSenhaService;
    private final MeterRegistry meterRegistry;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        tentativaLoginService.verificar(email);
        try {
            var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.senha()));
            var principal = (UsuarioPrincipal) authentication.getPrincipal();
            tentativaLoginService.sucesso(email);
            meterRegistry.counter("jsboy.auth.login", "result", "success").increment();
            log.info("security_event=login result=success user_id={} profile={}",
                principal.getId(), principal.getUsuario().getPerfilEfetivo());
            return refreshTokenService.emitir(principal.getUsuario());
        } catch (AuthenticationException exception) {
            tentativaLoginService.falha(email);
            meterRegistry.counter("jsboy.auth.login", "result", "failure").increment();
            log.warn("security_event=login result=failure");
            throw exception;
        }
    }

    @PostMapping("/refresh")
    public LoginResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return refreshTokenService.rotacionar(request.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        refreshTokenService.revogar(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password/request")
    public ResponseEntity<Map<String, String>> solicitarSenha(
        @Valid @RequestBody RecuperacaoSenhaRequest request
    ) {
        recuperacaoSenhaService.solicitar(request.email());
        return ResponseEntity.accepted().body(Map.of(
            "message", "Se a conta existir, as instrucoes serao enviadas"
        ));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> redefinir(@Valid @RequestBody RedefinirSenhaRequest request) {
        recuperacaoSenhaService.redefinir(request.token(), request.novaSenha());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UsuarioAutenticadoResponse me(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return UsuarioAutenticadoResponse.from(principal.getUsuario());
    }
}
