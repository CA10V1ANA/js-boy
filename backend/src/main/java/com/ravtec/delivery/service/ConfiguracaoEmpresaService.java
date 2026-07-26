package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ConfiguracaoEmpresaRequest;
import com.ravtec.delivery.dto.ConfiguracaoEmpresaResponse;
import com.ravtec.delivery.entity.ConfiguracaoEmpresa;
import com.ravtec.delivery.repository.ConfiguracaoEmpresaRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracaoEmpresaService {
    private final ConfiguracaoEmpresaRepository repository;
    private final NormalizacaoService normalizacao;
    private final VersionamentoService versionamento;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public ConfiguracaoEmpresaResponse consultar() {
        return toResponse(buscarAtual());
    }

    @Transactional
    public ConfiguracaoEmpresaResponse atualizar(Long versao, ConfiguracaoEmpresaRequest request) {
        var config = buscarAtual();
        versionamento.validar(versao, config.getVersion());
        var anterior = resumo(config);
        preencher(config, request);
        auditoriaService.registrar("CONFIGURACAO_EMPRESA_ALTERADA", "CONFIGURACAO_EMPRESA", config.getId(),
            anterior, resumo(config), null);
        return toResponse(config);
    }

    private ConfiguracaoEmpresa buscarAtual() {
        return repository.findAll().stream().findFirst()
            .orElseThrow(() -> new IllegalStateException("Configuracao da empresa nao encontrada"));
    }

    private void preencher(ConfiguracaoEmpresa config, ConfiguracaoEmpresaRequest request) {
        config.setNomeFantasia(normalizacao.texto(request.nomeFantasia()));
        config.setTelefone(normalizacao.telefoneOpcional(request.telefone()));
        config.setWhatsapp(normalizacao.telefoneOpcional(request.whatsapp()));
        config.setEmail(normalizacao.email(request.email()));
        config.setCep(normalizacao.digitos(request.cep()));
        config.setLogradouro(normalizacao.texto(request.logradouro()));
        config.setNumero(normalizacao.texto(request.numero()));
        config.setComplemento(normalizacao.texto(request.complemento()));
        config.setBairro(normalizacao.texto(request.bairro()));
        config.setCidade(normalizacao.texto(request.cidade()));
        config.setEstado(request.estado() == null ? null : request.estado().trim().toUpperCase());
        config.setHorarioAtendimento(normalizacao.texto(request.horarioAtendimento()));
    }

    private Map<String, Object> resumo(ConfiguracaoEmpresa config) {
        return Map.of(
            "nomeFantasia", config.getNomeFantasia(),
            "telefone", valor(config.getTelefone()),
            "whatsapp", valor(config.getWhatsapp()),
            "email", valor(config.getEmail()),
            "cidade", valor(config.getCidade()),
            "estado", valor(config.getEstado())
        );
    }

    private String valor(String value) {
        return value == null ? "" : value;
    }

    private ConfiguracaoEmpresaResponse toResponse(ConfiguracaoEmpresa config) {
        return new ConfiguracaoEmpresaResponse(
            config.getId(), config.getNomeFantasia(), config.getTelefone(), config.getWhatsapp(),
            config.getEmail(), config.getCep(), config.getLogradouro(), config.getNumero(),
            config.getComplemento(), config.getBairro(), config.getCidade(), config.getEstado(),
            config.getHorarioAtendimento(), config.getVersion()
        );
    }
}
