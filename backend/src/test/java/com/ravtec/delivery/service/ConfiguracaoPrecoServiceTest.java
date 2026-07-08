package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.ConfiguracaoPrecoRequest;
import com.ravtec.delivery.dto.SimulacaoPrecoRequest;
import com.ravtec.delivery.entity.ConfiguracaoPreco;
import com.ravtec.delivery.repository.ConfiguracaoPrecoRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConfiguracaoPrecoServiceTest {

    @Mock
    private ConfiguracaoPrecoRepository configuracaoPrecoRepository;

    @InjectMocks
    private ConfiguracaoPrecoService configuracaoPrecoService;

    @Test
    void deveCalcularValorSomandoTaxaInicialEValorPorKm() {
        var config = criarConfig("10.00", "2.00", "15.00");

        var valor = configuracaoPrecoService.calcularValor(config, new BigDecimal("5.00"));

        assertThat(valor).isEqualByComparingTo("20.00");
    }

    @Test
    void deveAplicarValorMinimoQuandoCalculoForMenor() {
        var config = criarConfig("5.00", "1.00", "20.00");

        var valor = configuracaoPrecoService.calcularValor(config, new BigDecimal("2.00"));

        assertThat(valor).isEqualByComparingTo("20.00");
    }

    @Test
    void deveSimularValorComBaseNaConfiguracaoAtual() {
        when(configuracaoPrecoRepository.findAll()).thenReturn(List.of(criarConfig("10.00", "2.00", "15.00")));

        var resposta = configuracaoPrecoService.simular(new SimulacaoPrecoRequest(new BigDecimal("10")));

        assertThat(resposta.valorCalculado()).isEqualByComparingTo("30.00");
    }

    @Test
    void deveLancarExcecaoQuandoConfiguracaoNaoExiste() {
        when(configuracaoPrecoRepository.findAll()).thenReturn(List.of());

        assertThatThrownBy(() -> configuracaoPrecoService.consultar())
            .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void deveAtualizarNormalizandoEscalaDosValores() {
        var config = criarConfig("10.00", "2.00", "15.00");
        when(configuracaoPrecoRepository.findAll()).thenReturn(List.of(config));

        var resposta = configuracaoPrecoService.atualizar(
            new ConfiguracaoPrecoRequest(new BigDecimal("12"), new BigDecimal("3"), new BigDecimal("18"))
        );

        assertThat(resposta.taxaInicial()).isEqualByComparingTo("12.00");
        assertThat(resposta.valorPorKm()).isEqualByComparingTo("3.00");
        assertThat(resposta.valorMinimo()).isEqualByComparingTo("18.00");
    }

    private ConfiguracaoPreco criarConfig(String taxaInicial, String valorPorKm, String valorMinimo) {
        var config = new ConfiguracaoPreco();
        config.setTaxaInicial(new BigDecimal(taxaInicial));
        config.setValorPorKm(new BigDecimal(valorPorKm));
        config.setValorMinimo(new BigDecimal(valorMinimo));
        return config;
    }
}
