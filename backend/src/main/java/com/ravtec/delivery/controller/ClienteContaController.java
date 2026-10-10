package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.repository.UsuarioRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cliente/me")
@PreAuthorize("hasRole('CLIENTE')")
@RequiredArgsConstructor
public class ClienteContaController {

    private final IdentidadeAtual identidade;
    private final ClienteMapper mapper;
    private final NormalizacaoService normalizacao;
    private final AuditoriaService auditoria;
    private final CadastroClienteService cadastro;
    private final UsuarioRepository usuarios;

    public record Contato(@NotBlank @Size(max = 30) String telefone, @Size(max = 30) String whatsapp) {}

    public record Email(@NotBlank @jakarta.validation.constraints.Email @Size(max = 180) String email) {}

    @PatchMapping
    @Transactional
    public ClienteResponse atualizar(@Valid @RequestBody Contato d) {
        var c = identidade.clienteObrigatorio();
        c.setTelefone(normalizacao.telefoneObrigatorio(d.telefone()));
        c.setWhatsapp(normalizacao.telefoneOpcional(d.whatsapp()));
        auditoria.registrar("CONTATO_CLIENTE_ATUALIZADO", "CLIENTE", c.getId(), null, null, null);
        return mapper.toResponse(c);
    }

    @PostMapping("/email")
    @Transactional
    public void email(@Valid @RequestBody Email d) {
        identidade.clienteObrigatorio();
        var email = d.email().trim().toLowerCase(java.util.Locale.ROOT);
        if (
            usuarios.findByEmail(email).isPresent()
        ) throw new com.ravtec.delivery.exception.ConflitoException("E-mail já cadastrado");
        cadastro.limitar(identidade.principal().getId().toString());
        cadastro.enviarVerificacao(identidade.usuario(), email);
        auditoria.registrar(
            "TROCA_EMAIL_SOLICITADA",
            "USUARIO",
            identidade.principal().getId(),
            null,
            Map.of("verificacaoPendente", true),
            null
        );
    }
}
