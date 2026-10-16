package com.ravtec.delivery.controller;

import com.ravtec.delivery.dto.ConfiguracaoEmpresaResponse;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.dto.PerfilEntregadorRequest;
import com.ravtec.delivery.mapper.EntregadorMapper;
import com.ravtec.delivery.security.IdentidadeAtual;
import com.ravtec.delivery.service.*;
import jakarta.validation.Valid;
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
    private final PerfilContaService perfis;
    private final ConfiguracaoEmpresaService empresa;


    @GetMapping("/perfil")
    @Transactional(readOnly = true)
    public EntregadorResponse perfil() {
        return mapper.toResponse(identidade.entregadorObrigatorio());
    }

    @PatchMapping("/perfil")
    public EntregadorResponse atualizar(
        @Valid @RequestBody PerfilEntregadorRequest dados,
        @RequestHeader(name = "If-Match", required = false) Long versao
    ) {
        return perfis.atualizarEntregador(dados, versao);
    }

    @GetMapping("/contato")
    @Transactional(readOnly = true)
    public ConfiguracaoEmpresaResponse contato() {
        identidade.entregadorObrigatorio();
        return empresa.consultar();
    }
}
