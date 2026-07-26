package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ConfiguracaoPrecoRequest;
import com.ravtec.delivery.dto.ConfiguracaoPrecoResponse;
import com.ravtec.delivery.dto.SimulacaoPrecoRequest;
import com.ravtec.delivery.dto.SimulacaoPrecoResponse;
import com.ravtec.delivery.entity.ConfiguracaoPreco;
import com.ravtec.delivery.repository.ConfiguracaoPrecoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracaoPrecoService {
    private final ConfiguracaoPrecoRepository configuracaoPrecoRepository;
    private final VersionamentoService versionamento = new VersionamentoService();
    @Autowired(required = false)
    private AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public ConfiguracaoPrecoResponse consultar() {
        return toResponse(buscarAtual());
    }

    @Transactional
    public ConfiguracaoPrecoResponse atualizar(ConfiguracaoPrecoRequest request) {
        return atualizar(request, null);
    }

    @Transactional
    public ConfiguracaoPrecoResponse atualizar(ConfiguracaoPrecoRequest request, Long versao) {
        var config = buscarAtual();
        versionamento.validar(versao, config.getVersion());
        var anterior = resumo(config);
        config.setTaxaInicial(normalizar(request.taxaInicial()));
        config.setValorPorKm(normalizar(request.valorPorKm()));
        config.setValorMinimo(normalizar(request.valorMinimo()));
        if (auditoriaService != null) {
            auditoriaService.registrar("PRECO_ALTERADO", "CONFIGURACAO_PRECO", config.getId(),
                anterior, resumo(config), null);
        }
        return toResponse(config);
    }

    @Transactional(readOnly = true)
    public SimulacaoPrecoResponse simular(SimulacaoPrecoRequest request) {
        var config = buscarAtual();
        var distancia = normalizar(request.distanciaKm());
        return new SimulacaoPrecoResponse(
            distancia, config.getTaxaInicial(), config.getValorPorKm(),
            config.getValorMinimo(), calcularValor(config, distancia)
        );
    }

    public BigDecimal calcularValor(ConfiguracaoPreco config, BigDecimal distanciaKm) {
        var bruto = config.getTaxaInicial().add(config.getValorPorKm().multiply(distanciaKm));
        return bruto.max(config.getValorMinimo()).setScale(2, RoundingMode.HALF_UP);
    }

    public ConfiguracaoPreco buscarAtual() {
        return configuracaoPrecoRepository.findAll().stream().findFirst()
            .orElseThrow(() -> new IllegalStateException("Configuracao de preco nao encontrada"));
    }

    private ConfiguracaoPrecoResponse toResponse(ConfiguracaoPreco config) {
        return new ConfiguracaoPrecoResponse(
            config.getId(), config.getTaxaInicial(), config.getValorPorKm(), config.getValorMinimo(), config.getVersion()
        );
    }

    private Map<String, BigDecimal> resumo(ConfiguracaoPreco config) {
        return Map.of("taxaInicial", config.getTaxaInicial(), "valorPorKm", config.getValorPorKm(),
            "valorMinimo", config.getValorMinimo());
    }

    private BigDecimal normalizar(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }
}
