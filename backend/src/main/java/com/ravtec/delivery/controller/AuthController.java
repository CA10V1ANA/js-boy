package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.security.UsuarioPrincipal;
import com.ravtec.delivery.service.*;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
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
    private final CadastroClienteService cadastro;

    @Value("${app.security.refresh-days:30}")
    private long refreshDays;

    private ResponseCookie createRefreshCookie(String refreshToken, long maxAge) {
        return ResponseCookie.from("refresh_token", refreshToken)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/auth")
            .maxAge(maxAge)
            .build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        com.ravtec.delivery.security.PoliticaSenha.validarTamanho(request.senha(), 1);
        String email = request.email().trim().toLowerCase();
        tentativaLoginService.verificarOrigem(httpRequest.getRemoteAddr());
        try {
            var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.senha())
            );
            var principal = (UsuarioPrincipal) authentication.getPrincipal();
            tentativaLoginService.sucesso(email);
            meterRegistry.counter("jsboy.auth.login", "result", "success").increment();
            log.info(
                "security_event=login result=success user_id={} profile={}",
                principal.getId(),
                principal.getUsuario().getPerfilEfetivo()
            );
            var fullResponse = refreshTokenService.emitir(principal.getUsuario());
            var cookie = createRefreshCookie(fullResponse.refreshToken(), refreshDays * 24 * 60 * 60);
            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new LoginResponse(fullResponse.token(), null, fullResponse.usuario()));
        } catch (AuthenticationException exception) {
            tentativaLoginService.falha(email);
            meterRegistry.counter("jsboy.auth.login", "result", "failure").increment();
            log.warn("security_event=login result=failure");
            throw exception;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
        @CookieValue(name = "refresh_token", required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadCredentialsException("Sessão expirada ou não encontrada");
        }
        var fullResponse = refreshTokenService.rotacionar(refreshToken);
        var cookie = createRefreshCookie(fullResponse.refreshToken(), refreshDays * 24 * 60 * 60);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(new LoginResponse(fullResponse.token(), null, fullResponse.usuario()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @CookieValue(name = "refresh_token", required = false) String refreshToken
    ) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revogar(refreshToken);
        }
        var cookie = createRefreshCookie("", 0);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }

    @PostMapping("/password/request")
    public ResponseEntity<Map<String, String>> solicitarSenha(
        @Valid @RequestBody RecuperacaoSenhaRequest request,
        HttpServletRequest httpRequest
    ) {
        recuperacaoSenhaService.solicitar(request.email(), httpRequest.getRemoteAddr());
        return ResponseEntity.accepted().body(
            Map.of("message", "Se a conta existir, as instruções serão enviadas")
        );
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> redefinir(@Valid @RequestBody RedefinirSenhaRequest request) {
        recuperacaoSenhaService.redefinir(request.token(), request.novaSenha());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/cadastro-cliente")
    public ResponseEntity<Map<String, String>> cadastrar(
        @Valid @RequestBody CadastroClienteRequest request,
        HttpServletRequest r
    ) {
        cadastro.cadastrar(request, r.getRemoteAddr());
        return ResponseEntity.accepted().body(
            Map.of("message", "Confirme o e-mail antes de entrar no portal")
        );
    }

    public record Verificacao(
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 200) String token
    ) {}

    @PostMapping("/verificar-email")
    public ResponseEntity<Void> verificar(@Valid @RequestBody Verificacao request) {
        cadastro.verificar(request.token());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reenviar-verificacao")
    public ResponseEntity<Map<String, String>> reenviar(
        @Valid @RequestBody RecuperacaoSenhaRequest request,
        HttpServletRequest r
    ) {
        cadastro.reenviar(request.email(), r.getRemoteAddr());
        return ResponseEntity.accepted().body(
            Map.of("message", "Se houver cadastro pendente, enviamos a verificação")
        );
    }

    public record Google(
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(
            max = 10000
        ) String credencial,
        @Valid ClienteRequest cliente
    ) {}

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> google(@Valid @RequestBody Google request, HttpServletRequest r) {
        var u = cadastro.entrarGoogle(request.credencial(), request.cliente(), r.getRemoteAddr());
        var full = refreshTokenService.emitir(u);
        return ResponseEntity.ok()
            .header(
                HttpHeaders.SET_COOKIE,
                createRefreshCookie(full.refreshToken(), refreshDays * 24 * 60 * 60).toString()
            )
            .body(new LoginResponse(full.token(), null, full.usuario()));
    }

    @GetMapping("/me")
    public UsuarioAutenticadoResponse me(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return UsuarioAutenticadoResponse.from(principal.getUsuario());
    }
}
