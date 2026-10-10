package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ConfiguracaoEmpresaResponse;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.mapper.EntregadorMapper;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/operacao-entregador")
@PreAuthorize("hasAnyRole('ENTREGADOR','PROPRIETARIO')")
@RequiredArgsConstructor
public class PerfilOperacionalController {

    private final IdentidadeAtual identidade;
    private final EntregadorMapper mapper;
    private final NormalizacaoService normalizacao;
    private final AuditoriaService auditoria;
    private final ConfiguracaoEmpresaService empresa;

    public record Contato(@NotBlank @Size(max = 30) String telefone) {}

    @GetMapping("/perfil")
    @Transactional(readOnly = true)
    public EntregadorResponse perfil() {
        return mapper.toResponse(identidade.entregadorObrigatorio());
    }

    @PatchMapping("/perfil")
    @Transactional
    public EntregadorResponse atualizar(@Valid @RequestBody Contato dados) {
        var e = identidade.entregadorObrigatorioParaAtualizacao();
        e.setTelefone(normalizacao.telefoneObrigatorio(dados.telefone()));
        auditoria.registrar(
            "CONTATO_OPERACIONAL_ATUALIZADO",
            "ENTREGADOR",
            e.getId(),
            null,
            java.util.Map.of("contexto", "ENTREGADOR"),
            null
        );
        return mapper.toResponse(e);
    }

    @GetMapping("/contato")
    @Transactional(readOnly = true)
    public ConfiguracaoEmpresaResponse contato() {
        identidade.entregadorObrigatorio();
        return empresa.consultar();
    }
}
