package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.DesignarEntregadorRequest;
import com.ravtec.delivery.dto.EntregaOperacionalResponse;
import com.ravtec.delivery.dto.EntregaRequest;
import com.ravtec.delivery.dto.EntregaResponse;
import com.ravtec.delivery.dto.EntregaStatusRequest;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.HistoricoEntrega;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.EntregaMapper;
import com.ravtec.delivery.repository.ClienteRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.repository.EntregadorRepository;
import com.ravtec.delivery.repository.HistoricoEntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EntregaService {
    private final EntregaRepository entregaRepository;
    private final ClienteRepository clienteRepository;
    private final EntregadorRepository entregadorRepository;
    private final HistoricoEntregaRepository historicoEntregaRepository;
    private final ConfiguracaoPrecoService configuracaoPrecoService;
    private final TabelaPrecoService tabelaPrecoService;
    private final EntregaMapper entregaMapper;
    private final IdentidadeAtual identidadeAtual;
    private final EntregaStatusPolicy entregaStatusPolicy;
    private final VersionamentoService versionamento = new VersionamentoService();
    private final NormalizacaoService normalizacao = new NormalizacaoService();
    @Autowired(required = false)
    private AuditoriaService auditoriaService;
    @Autowired(required = false)
    private com.ravtec.delivery.repository.ComprovanteEntregaRepository comprovanteRepository;

    @Transactional(readOnly = true)
    public List<EntregaResponse> listar(String busca) {
        var entregas = busca == null || busca.isBlank()
            ? entregaRepository.findAll()
            : entregaRepository.findByCodigoContainingIgnoreCaseOrClienteNomeContainingIgnoreCase(busca, busca);
        return entregas.stream().map(entregaMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EntregaResponse consultar(UUID id) {
        return entregaMapper.toResponse(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public List<EntregaOperacionalResponse> listarMinhasEntregas() {
        identidadeAtual.entregadorObrigatorio();
        return entregaRepository.findByEntregadorUsuarioIdOrderByCriadoEmDesc(identidadeAtual.principal().getId()).stream()
            .map(entregaMapper::toOperacionalResponse).toList();
    }

    @Transactional(readOnly = true)
    public EntregaOperacionalResponse consultarMinhaEntrega(UUID id) {
        identidadeAtual.entregadorObrigatorio();
        return entregaMapper.toOperacionalResponse(buscarMinhaEntrega(id));
    }

    @Transactional
    public EntregaResponse criar(EntregaRequest request) {
        var entrega = new Entrega();
        preencher(entrega, request);
        entrega.setCodigo(gerarCodigo());
        entrega.setStatus(request.entregadorId() == null
            ? StatusEntrega.SOLICITADA : StatusEntrega.ENTREGADOR_DESIGNADO);
        var salva = entregaRepository.save(entrega);
        registrarHistorico(salva, null, salva.getStatus());
        auditar("ENTREGA_CRIADA", salva, null, resumo(salva), null);
        return entregaMapper.toResponse(salva);
    }

    @Transactional
    public EntregaResponse atualizar(UUID id, EntregaRequest request) {
        return atualizar(id, request, null);
    }

    @Transactional
    public EntregaResponse atualizar(UUID id, EntregaRequest request, Long versao) {
        var entrega = buscarEntidade(id);
        versionamento.validar(versao, entrega.getVersion());
        entregaStatusPolicy.validarEdicaoAntesDaColeta(entrega.getStatus());
        var entregadorAtualId = entrega.getEntregador() == null ? null : entrega.getEntregador().getId();
        if (!Objects.equals(entregadorAtualId, request.entregadorId())) {
            throw new IllegalArgumentException("Use o endpoint de designacao para trocar o entregador");
        }
        var anterior = resumo(entrega);
        preencher(entrega, request);
        auditar("ENTREGA_ATUALIZADA", entrega, anterior, resumo(entrega), request.observacaoValorManual());
        return entregaMapper.toResponse(entrega);
    }

    @Transactional
    public EntregaResponse alterarStatus(UUID id, EntregaStatusRequest request) {
        return alterarStatus(id, request, null);
    }

    @Transactional
    public EntregaResponse alterarStatus(UUID id, EntregaStatusRequest request, Long versao) {
        var entrega = buscarEntidade(id);
        versionamento.validar(versao, entrega.getVersion());
        aplicarTransicao(entrega, request.status(), false);
        return entregaMapper.toResponse(entrega);
    }

    @Transactional
    public EntregaOperacionalResponse alterarStatusMinhaEntrega(UUID id, EntregaStatusRequest request) {
        return alterarStatusMinhaEntrega(id, request, null);
    }

    @Transactional
    public EntregaOperacionalResponse alterarStatusMinhaEntrega(
        UUID id,
        EntregaStatusRequest request,
        Long versao
    ) {
        identidadeAtual.entregadorObrigatorio();
        var entrega = buscarMinhaEntrega(id);
        versionamento.validar(versao, entrega.getVersion());
        aplicarTransicao(entrega, request.status(), true);
        return entregaMapper.toOperacionalResponse(entrega);
    }

    @Transactional
    public EntregaResponse designarEntregador(UUID id, DesignarEntregadorRequest request) {
        return designarEntregador(id, request, null);
    }

    @Transactional
    public EntregaResponse designarEntregador(UUID id, DesignarEntregadorRequest request, Long versao) {
        var entrega = buscarEntidade(id);
        versionamento.validar(versao, entrega.getVersion());
        entregaStatusPolicy.validarEdicaoAntesDaColeta(entrega.getStatus());
        var entregador = entregadorRepository.findById(request.entregadorId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador nao encontrado"));
        if (!entregador.isAtivo()) {
            throw new IllegalStateException("Entregador inativo nao pode ser designado");
        }
        var anteriorId = entrega.getEntregador() == null ? null : entrega.getEntregador().getId();
        var statusAnterior = entrega.getStatus();
        entrega.setEntregador(entregador);
        if (statusAnterior != StatusEntrega.ENTREGADOR_DESIGNADO) {
            entregaStatusPolicy.validarTransicao(statusAnterior, StatusEntrega.ENTREGADOR_DESIGNADO);
            entrega.setStatus(StatusEntrega.ENTREGADOR_DESIGNADO);
            registrarHistorico(entrega, statusAnterior, StatusEntrega.ENTREGADOR_DESIGNADO);
        }
        auditar(anteriorId == null ? "ENTREGADOR_DESIGNADO" : "ENTREGADOR_TROCADO", entrega,
            Map.of("entregadorId", valor(anteriorId)), Map.of("entregadorId", entregador.getId().toString()), null);
        return entregaMapper.toResponse(entrega);
    }

    private void preencher(Entrega entrega, EntregaRequest request) {
        var cliente = clienteRepository.findById(request.clienteId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrado"));
        if (!cliente.isAtivo()) {
            throw new IllegalStateException("Cliente inativo nao pode receber nova entrega");
        }
        var config = configuracaoPrecoService.buscarAtual();
        var distancia = request.distanciaKm().setScale(2, RoundingMode.HALF_UP);
        var calculo = tabelaPrecoService.calcular(
            request.bairroDestino(), request.tipoVeiculo(), request.tempoEsperaMinutos(),
            request.possuiRetorno(), request.valorNegociado(), distancia
        );
        if (calculo.valorNegociadoObrigatorio() || calculo.valorCalculado() == null) {
            throw new IllegalArgumentException("Informe o valor negociado para a Regiao Metropolitana");
        }
        var valorCalculado = calculo.valorCalculado();
        var valorFinal = request.valorFinal() == null
            ? valorCalculado : request.valorFinal().setScale(2, RoundingMode.HALF_UP);
        if (valorFinal.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("O valor final nao pode ser negativo");
        }
        entrega.setCliente(cliente);
        if (request.entregadorId() == null) {
            entrega.setEntregador(null);
        } else {
            var entregador = entregadorRepository.findById(request.entregadorId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador nao encontrado"));
            if (!entregador.isAtivo()) {
                throw new IllegalStateException("Entregador inativo nao pode ser designado");
            }
            entrega.setEntregador(entregador);
        }
        entrega.setEnderecoOrigem(request.enderecoOrigem().trim());
        entrega.setBairroOrigem(request.bairroOrigem().trim());
        entrega.setEnderecoDestino(request.enderecoDestino().trim());
        entrega.setBairroDestino(request.bairroDestino().trim());
        entrega.setDestinatarioNome(request.destinatarioNome().trim().replaceAll("\\s+", " "));
        entrega.setDestinatarioTelefone(normalizacao.telefoneObrigatorio(request.destinatarioTelefone()));
        entrega.setDescricaoMercadoria(request.descricaoMercadoria().trim());
        entrega.setObservacoes(limpar(request.observacoes()));
        entrega.setDistanciaKm(distancia);
        entrega.setTaxaInicial(config.getTaxaInicial());
        entrega.setValorPorKm(config.getValorPorKm());
        entrega.setValorCalculado(valorCalculado);
        entrega.setValorFinal(valorFinal);
        entrega.setTipoVeiculo(calculo.tipoVeiculo());
        entrega.setOrigemPreco(calculo.origemPreco());
        entrega.setAreaPrecoCodigo(calculo.areaCodigo());
        entrega.setAreaPrecoNome(calculo.areaNome());
        entrega.setTarifaBairro(calculo.tarifaBase());
        entrega.setPossuiRetorno(Boolean.TRUE.equals(request.possuiRetorno()));
        entrega.setTaxaRetornoAplicada(calculo.taxaRetorno());
        entrega.setTempoEsperaMinutos(request.tempoEsperaMinutos() == null ? 0 : request.tempoEsperaMinutos());
        entrega.setTaxaEsperaAplicada(calculo.taxaEspera());
        entrega.setValorNegociado(request.valorNegociado() == null ? null
            : request.valorNegociado().setScale(2, RoundingMode.HALF_UP));
        entrega.setObservacaoValorManual(valorFinal.compareTo(valorCalculado) == 0
            ? null : limpar(request.observacaoValorManual()));
        if (valorFinal.compareTo(valorCalculado) != 0 && entrega.getObservacaoValorManual() == null) {
            throw new IllegalArgumentException("Informe o motivo da alteracao manual do valor");
        }
    }

    private void registrarHistorico(Entrega entrega, StatusEntrega anterior, StatusEntrega novoStatus) {
        var historico = new HistoricoEntrega();
        historico.setEntrega(entrega);
        historico.setStatusAnterior(anterior);
        historico.setNovoStatus(novoStatus);
        historico.setUsuarioResponsavel(identidadeAtual.usuario());
        historicoEntregaRepository.save(historico);
        entrega.getHistorico().add(historico);
    }

    private void aplicarTransicao(Entrega entrega, StatusEntrega destino, boolean acaoDoEntregador) {
        var anterior = entrega.getStatus();
        if (acaoDoEntregador) {
            entregaStatusPolicy.validarTransicaoDoEntregador(anterior, destino);
        } else {
            entregaStatusPolicy.validarTransicao(anterior, destino);
        }
        if (destino == StatusEntrega.ENTREGUE && comprovanteRepository != null
            && !comprovanteRepository.existsByEntregaIdAndTipoAndSubstituidoPorIsNull(
                entrega.getId(), com.ravtec.delivery.entity.TipoComprovante.ENTREGA)) {
            throw new IllegalStateException("Registre o comprovante de entrega antes de concluir");
        }
        if (entregaStatusPolicy.exigeEntregador(destino) && entrega.getEntregador() == null) {
            throw new IllegalStateException("Status exige um entregador designado");
        }
        if (destino == StatusEntrega.AGUARDANDO_ENTREGADOR) {
            entrega.setEntregador(null);
        }
        entrega.setStatus(destino);
        if (destino == StatusEntrega.ENTREGUE) {
            entrega.setConcluidaEm(OffsetDateTime.now());
        }
        registrarHistorico(entrega, anterior, destino);
        auditar(destino == StatusEntrega.CANCELADA ? "ENTREGA_CANCELADA" : "STATUS_ALTERADO", entrega,
            Map.of("status", anterior.name()), Map.of("status", destino.name()), null);
        log.info("Status da entrega alterado: entregaId={} de={} para={}", entrega.getId(), anterior, destino);
    }

    private Map<String, Object> resumo(Entrega entrega) {
        return Map.of(
            "codigo", valor(entrega.getCodigo()), "clienteId", valor(entrega.getCliente().getId()),
            "entregadorId", valor(entrega.getEntregador() == null ? null : entrega.getEntregador().getId()),
            "status", entrega.getStatus().name(), "valorFinal", entrega.getValorFinal()
        );
    }

    private String valor(Object value) {
        return value == null ? "" : value.toString();
    }

    private String limpar(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void auditar(String acao, Entrega entrega, Object antes, Object depois, String motivo) {
        if (auditoriaService != null && entrega.getId() != null) {
            auditoriaService.registrar(acao, "ENTREGA", entrega.getId(), antes, depois, motivo);
        }
    }

    private Entrega buscarEntidade(UUID id) {
        return entregaRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
    }

    private Entrega buscarMinhaEntrega(UUID id) {
        return entregaRepository.findByIdAndEntregadorUsuarioId(id, identidadeAtual.principal().getId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
    }

    private String gerarCodigo() {
        return "JSB-" + OffsetDateTime.now().toLocalDate().toString().replace("-", "")
            + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
