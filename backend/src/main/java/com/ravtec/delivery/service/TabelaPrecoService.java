package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.AreaPrecoResponse;
import com.ravtec.delivery.dto.SimulacaoTabelaPrecoRequest;
import com.ravtec.delivery.dto.SimulacaoTabelaPrecoResponse;
import com.ravtec.delivery.dto.TabelaPrecoRequest;
import com.ravtec.delivery.dto.TabelaPrecoResponse;
import com.ravtec.delivery.entity.AreaPreco;
import com.ravtec.delivery.entity.OrigemPreco;
import com.ravtec.delivery.entity.TipoVeiculo;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.AreaPrecoRepository;
import com.ravtec.delivery.repository.BairroPrecoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TabelaPrecoService {
    private final AreaPrecoRepository areaPrecoRepository;
    private final BairroPrecoRepository bairroPrecoRepository;
    private final ConfiguracaoPrecoService configuracaoPrecoService;
    private final VersionamentoService versionamento = new VersionamentoService();
    @Autowired(required = false)
    private AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public TabelaPrecoResponse consultar() {
        var config = configuracaoPrecoService.buscarAtual();
        var areas = areaPrecoRepository.findAllByAtivoTrueOrderByOrdemAsc().stream()
            .map(this::toResponse)
            .toList();
        return new TabelaPrecoResponse(
            config.getId(), config.getTabelaNome(), config.getVigenteDesde(), config.getTaxaRetorno(),
            config.getTaxaEsperaTrintaMinutos(), config.getTaxaInicial(), config.getValorPorKm(),
            config.getValorMinimo(), areas, config.getVersion()
        );
    }

    @Transactional
    public TabelaPrecoResponse atualizar(TabelaPrecoRequest request, Long versaoConfiguracao) {
        var config = configuracaoPrecoService.buscarAtual();
        versionamento.validar(versaoConfiguracao, config.getVersion());
        var anterior = Map.of(
            "taxaRetorno", config.getTaxaRetorno(),
            "taxaEsperaTrintaMinutos", config.getTaxaEsperaTrintaMinutos(),
            "taxaInicialFallback", config.getTaxaInicial(),
            "valorPorKmFallback", config.getValorPorKm(),
            "valorMinimoFallback", config.getValorMinimo()
        );
        config.setTaxaRetorno(normalizar(request.taxaRetorno()));
        config.setTaxaEsperaTrintaMinutos(normalizar(request.taxaEsperaTrintaMinutos()));
        config.setTaxaInicial(normalizar(request.taxaInicialFallback()));
        config.setValorPorKm(normalizar(request.valorPorKmFallback()));
        config.setValorMinimo(normalizar(request.valorMinimoFallback()));

        var areasPorId = areaPrecoRepository.findAllByAtivoTrueOrderByOrdemAsc().stream()
            .collect(java.util.stream.Collectors.toMap(AreaPreco::getId, area -> area));
        request.areas().forEach(item -> {
            var area = areasPorId.get(item.id());
            if (area == null) {
                throw new RecursoNaoEncontradoException("Area de preco nao encontrada");
            }
            versionamento.validar(item.versao(), area.getVersion());
            if (!area.isValorNegociado()) {
                if (item.valorMoto() == null || item.valorCarro() == null) {
                    throw new IllegalArgumentException("Informe os valores de moto e carro para " + area.getNome());
                }
                area.setValorMoto(normalizar(item.valorMoto()));
                area.setValorCarro(normalizar(item.valorCarro()));
            }
        });

        if (auditoriaService != null) {
            auditoriaService.registrar(
                "TABELA_PRECO_ALTERADA", "CONFIGURACAO_PRECO", config.getId(), anterior,
                Map.of(
                    "taxaRetorno", config.getTaxaRetorno(),
                    "taxaEsperaTrintaMinutos", config.getTaxaEsperaTrintaMinutos(),
                    "taxaInicialFallback", config.getTaxaInicial(),
                    "valorPorKmFallback", config.getValorPorKm(),
                    "valorMinimoFallback", config.getValorMinimo(),
                    "areasAtualizadas", request.areas().size()
                ), null
            );
        }
        areaPrecoRepository.flush();
        return consultar();
    }

    @Transactional(readOnly = true)
    public SimulacaoTabelaPrecoResponse simular(SimulacaoTabelaPrecoRequest request) {
        return calcular(
            request.bairroDestino(), request.tipoVeiculo(), request.tempoEsperaMinutos(),
            request.possuiRetorno(), request.valorNegociado(), request.distanciaKm()
        );
    }

    @Transactional(readOnly = true)
    public SimulacaoTabelaPrecoResponse calcular(
        String bairroDestino,
        TipoVeiculo tipoVeiculo,
        Integer tempoEsperaMinutos,
        Boolean possuiRetorno,
        BigDecimal valorNegociado,
        BigDecimal distanciaKm
    ) {
        var config = configuracaoPrecoService.buscarAtual();
        var tipo = validarTipo(tipoVeiculo);
        var minutos = tempoEsperaMinutos == null ? 0 : tempoEsperaMinutos;
        if (minutos < 0) {
            throw new IllegalArgumentException("O tempo de espera nao pode ser negativo");
        }
        var blocosEspera = minutos / 30;
        var taxaEspera = config.getTaxaEsperaTrintaMinutos()
            .multiply(BigDecimal.valueOf(blocosEspera)).setScale(2, RoundingMode.HALF_UP);
        var taxaRetorno = Boolean.TRUE.equals(possuiRetorno)
            ? config.getTaxaRetorno().setScale(2, RoundingMode.HALF_UP)
            : dinheiroZero();

        var bairro = bairroPrecoRepository.findByNomeNormalizadoAndAreaAtivoTrue(normalizarBairro(bairroDestino));
        if (bairro.isEmpty()) {
            var distancia = distanciaKm == null ? BigDecimal.ZERO : distanciaKm;
            var base = configuracaoPrecoService.calcularValor(config, distancia.setScale(2, RoundingMode.HALF_UP));
            return resposta(
                bairroDestino, null, "Fora da tabela", tipo, OrigemPreco.DISTANCIA, base,
                taxaRetorno, taxaEspera, blocosEspera, false,
                "Bairro fora da tabela. Aplicado o calculo alternativo por distancia."
            );
        }

        var area = bairro.get().getArea();
        if (area.isValorNegociado()) {
            var base = valorNegociado == null ? null : normalizar(valorNegociado);
            return resposta(
                bairro.get().getNome(), area.getCodigo(), area.getNome(), tipo, OrigemPreco.NEGOCIADO,
                base, taxaRetorno, taxaEspera, blocosEspera, base == null,
                base == null ? "Informe o valor negociado para esta entrega." : "Valor negociado para esta entrega."
            );
        }

        var base = tipo == TipoVeiculo.CARRO ? area.getValorCarro() : area.getValorMoto();
        if (base == null) {
            throw new IllegalStateException("Valor nao configurado para " + area.getNome());
        }
        return resposta(
            bairro.get().getNome(), area.getCodigo(), area.getNome(), tipo, OrigemPreco.AREA,
            normalizar(base), taxaRetorno, taxaEspera, blocosEspera, false,
            area.getNome() + " identificada pela tabela vigente."
        );
    }

    private SimulacaoTabelaPrecoResponse resposta(
        String bairro,
        String areaCodigo,
        String areaNome,
        TipoVeiculo tipo,
        OrigemPreco origem,
        BigDecimal base,
        BigDecimal retorno,
        BigDecimal espera,
        int blocosEspera,
        boolean negociadoObrigatorio,
        String mensagem
    ) {
        var total = base == null ? null : base.add(retorno).add(espera).setScale(2, RoundingMode.HALF_UP);
        return new SimulacaoTabelaPrecoResponse(
            bairro == null ? "" : bairro.trim(), areaCodigo, areaNome, tipo, origem, base,
            retorno, espera, blocosEspera, total, negociadoObrigatorio, mensagem
        );
    }

    private AreaPrecoResponse toResponse(AreaPreco area) {
        return new AreaPrecoResponse(
            area.getId(), area.getCodigo(), area.getNome(), area.getOrdem(), area.getValorMoto(),
            area.getValorCarro(), area.isValorNegociado(),
            area.getBairros().stream().map(item -> item.getNome()).toList(), area.getVersion()
        );
    }

    private TipoVeiculo validarTipo(TipoVeiculo tipoVeiculo) {
        var tipo = tipoVeiculo == null ? TipoVeiculo.MOTO : tipoVeiculo;
        if (tipo != TipoVeiculo.MOTO && tipo != TipoVeiculo.CARRO) {
            throw new IllegalArgumentException("Use Moto ou Carro para calcular o preco");
        }
        return tipo;
    }

    private BigDecimal normalizar(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal dinheiroZero() {
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    static String normalizarBairro(String valor) {
        if (valor == null) {
            return "";
        }
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .trim()
            .replaceAll("\\s+", " ");
    }
}
