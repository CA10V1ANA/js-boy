package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.AreaPreco;
import com.ravtec.delivery.entity.BairroPreco;
import com.ravtec.delivery.entity.ConfiguracaoPreco;
import com.ravtec.delivery.entity.OrigemPreco;
import com.ravtec.delivery.entity.TipoVeiculo;
import com.ravtec.delivery.repository.AreaPrecoRepository;
import com.ravtec.delivery.repository.BairroPrecoRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TabelaPrecoServiceTest {
    @Mock
    private AreaPrecoRepository areaPrecoRepository;
    @Mock
    private BairroPrecoRepository bairroPrecoRepository;
    @Mock
    private ConfiguracaoPrecoService configuracaoPrecoService;

    private TabelaPrecoService tabelaPrecoService;

    @BeforeEach
    void setUp() {
        tabelaPrecoService = new TabelaPrecoService(
            areaPrecoRepository, bairroPrecoRepository, configuracaoPrecoService
        );
        when(configuracaoPrecoService.buscarAtual()).thenReturn(criarConfig());
    }

    @Test
    void deveCalcularAreaRetornoEUmBlocoDeEsperaParaTrintaEUmMinutos() {
        var area = criarArea("AREA_2", "Área 2", "26.00", false);
        when(bairroPrecoRepository.findByNomeNormalizadoAndAreaAtivoTrue("coco"))
            .thenReturn(Optional.of(criarBairro("Cocó", area)));

        var resposta = tabelaPrecoService.calcular(
            "  COCO  ", TipoVeiculo.MOTO, 31, true, null, BigDecimal.ZERO
        );

        assertThat(resposta.origemPreco()).isEqualTo(OrigemPreco.AREA);
        assertThat(resposta.tarifaBase()).isEqualByComparingTo("26.00");
        assertThat(resposta.taxaRetorno()).isEqualByComparingTo("15.00");
        assertThat(resposta.taxaEspera()).isEqualByComparingTo("15.00");
        assertThat(resposta.blocosEspera()).isEqualTo(1);
        assertThat(resposta.valorCalculado()).isEqualByComparingTo("56.00");
    }

    @Test
    void deveExigirValorNegociadoParaAreaMetropolitana() {
        var area = criarArea("METROPOLITANA", "Área Metropolitana", null, true);
        when(bairroPrecoRepository.findByNomeNormalizadoAndAreaAtivoTrue("caucaia"))
            .thenReturn(Optional.of(criarBairro("Caucaia", area)));

        var resposta = tabelaPrecoService.calcular(
            "Caucaia", TipoVeiculo.CARRO, 0, false, null, BigDecimal.ZERO
        );

        assertThat(resposta.origemPreco()).isEqualTo(OrigemPreco.NEGOCIADO);
        assertThat(resposta.valorNegociadoObrigatorio()).isTrue();
        assertThat(resposta.valorCalculado()).isNull();
    }

    @Test
    void deveUsarDistanciaQuandoBairroNaoEstaNaTabela() {
        when(bairroPrecoRepository.findByNomeNormalizadoAndAreaAtivoTrue("bairro novo"))
            .thenReturn(Optional.empty());
        when(configuracaoPrecoService.calcularValor(any(ConfiguracaoPreco.class), any(BigDecimal.class)))
            .thenReturn(new BigDecimal("20.00"));

        var resposta = tabelaPrecoService.calcular(
            "Bairro Novo", TipoVeiculo.MOTO, 0, false, null, new BigDecimal("5")
        );

        assertThat(resposta.origemPreco()).isEqualTo(OrigemPreco.DISTANCIA);
        assertThat(resposta.valorCalculado()).isEqualByComparingTo("20.00");
    }

    private ConfiguracaoPreco criarConfig() {
        var config = new ConfiguracaoPreco();
        config.setTaxaInicial(new BigDecimal("10.00"));
        config.setValorPorKm(new BigDecimal("2.00"));
        config.setValorMinimo(new BigDecimal("15.00"));
        return config;
    }

    private AreaPreco criarArea(String codigo, String nome, String valor, boolean negociado) {
        var area = new AreaPreco();
        area.setCodigo(codigo);
        area.setNome(nome);
        area.setValorNegociado(negociado);
        if (valor != null) {
            area.setValorMoto(new BigDecimal(valor));
            area.setValorCarro(new BigDecimal(valor));
        }
        return area;
    }

    private BairroPreco criarBairro(String nome, AreaPreco area) {
        var bairro = new BairroPreco();
        bairro.setNome(nome);
        bairro.setArea(area);
        return bairro;
    }
}
