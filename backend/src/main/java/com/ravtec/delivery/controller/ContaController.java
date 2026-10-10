package com.ravtec.delivery.controller;

import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conta")
@RequiredArgsConstructor
public class ContaController {

    private final IdentidadeAtual identidade;
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final CadastroClienteService cadastro;
    private final RefreshTokenRepository refresh;
    private final AuditoriaService auditoria;

    public record Senha(
        @NotBlank @Size(max = 72) String senhaAtual,
        @NotBlank @Size(min = 12, max = 72) String novaSenha
    ) {}

    public record Google(@NotBlank @Size(max = 10000) String credencial) {}

    @PostMapping("/senha")
    @Transactional
    public void senha(@Valid @RequestBody Senha request) {
        var u = usuarios.findById(identidade.principal().getId()).orElseThrow();
        if (
            !u.isSenhaLocal() || !encoder.matches(request.senhaAtual(), u.getSenhaHash())
        ) throw new org.springframework.security.authentication.BadCredentialsException(
            "Senha atual inválida"
        );
        cadastro.validarSenha(request.novaSenha());
        u.setSenhaHash(encoder.encode(request.novaSenha()));
        refresh.revogarAtivosDoUsuario(u.getId(), OffsetDateTime.now());
        auditoria.registrar("SENHA_ALTERADA", "USUARIO", u.getId(), null, null, null);
    }

    @PostMapping("/google")
    @Transactional
    public void google(@Valid @RequestBody Google request) {
        var u = usuarios.findById(identidade.principal().getId()).orElseThrow();
        cadastro.vincularGoogle(u, request.credencial());
        auditoria.registrar("GOOGLE_VINCULADO", "USUARIO", u.getId(), null, null, null);
    }

    @GetMapping
    public Map<String, Object> consultar() {
        return Map.of(
            "senhaLocal",
            identidade.usuario().isSenhaLocal(),
            "googleVinculado",
            identidade.usuario().getGoogleSub() != null
        );
    }
}
