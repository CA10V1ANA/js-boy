package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ConfiguracaoPrecoRequest;
import com.ravtec.delivery.dto.ConfiguracaoPrecoResponse;
import com.ravtec.delivery.dto.SimulacaoPrecoRequest;
import com.ravtec.delivery.dto.SimulacaoPrecoResponse;
import com.ravtec.delivery.entity.ConfiguracaoPreco;
import com.ravtec.delivery.repository.ConfiguracaoPrecoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracaoPrecoService {

    private final ConfiguracaoPrecoRepository configuracaoPrecoRepository;

    @Transactional(readOnly = true)
    public ConfiguracaoPrecoResponse consultar() {
        return toResponse(buscarAtual());
    }

    @Transactional
    public ConfiguracaoPrecoResponse atualizar(ConfiguracaoPrecoRequest request) {
        var config = buscarAtual();
        config.setTaxaInicial(normalizar(request.taxaInicial()));
        config.setValorPorKm(normalizar(request.valorPorKm()));
        config.setValorMinimo(normalizar(request.valorMinimo()));
        return toResponse(config);
    }

    @Transactional(readOnly = true)
    public SimulacaoPrecoResponse simular(SimulacaoPrecoRequest request) {
        var config = buscarAtual();
        var distancia = normalizar(request.distanciaKm());
        var valor = calcularValor(config, distancia);
        return new SimulacaoPrecoResponse(
            distancia,
            config.getTaxaInicial(),
            config.getValorPorKm(),
            config.getValorMinimo(),
            valor
        );
    }

    public BigDecimal calcularValor(ConfiguracaoPreco config, BigDecimal distanciaKm) {
        var bruto = config.getTaxaInicial().add(config.getValorPorKm().multiply(distanciaKm));
        return bruto.max(config.getValorMinimo()).setScale(2, RoundingMode.HALF_UP);
    }

    public ConfiguracaoPreco buscarAtual() {
        return configuracaoPrecoRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Configuracao de preco nao encontrada"));
    }

    private ConfiguracaoPrecoResponse toResponse(ConfiguracaoPreco config) {
        return new ConfiguracaoPrecoResponse(
            config.getId(),
            config.getTaxaInicial(),
            config.getValorPorKm(),
            config.getValorMinimo()
        );
    }

    private BigDecimal normalizar(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }
}
