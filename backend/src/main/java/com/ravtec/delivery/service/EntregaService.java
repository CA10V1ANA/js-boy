package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.DesignarEntregadorRequest;
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
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private final EntregaRepository entregaRepository;
    private final ClienteRepository clienteRepository;
    private final EntregadorRepository entregadorRepository;
    private final HistoricoEntregaRepository historicoEntregaRepository;
    private final ConfiguracaoPrecoService configuracaoPrecoService;
    private final EntregaMapper entregaMapper;

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
    public List<EntregaResponse> listarMinhasEntregas() {
        var usuario = usuarioAtual();
        return entregaRepository.findByEntregadorUsuarioId(usuario.getId()).stream()
            .map(entregaMapper::toResponse)
            .toList();
    }

    @Transactional
    public EntregaResponse criar(EntregaRequest request) {
        var entrega = new Entrega();
        preencher(entrega, request);
        entrega.setCodigo(gerarCodigo());
        entrega.setStatus(request.entregadorId() == null
            ? StatusEntrega.SOLICITADA
            : StatusEntrega.ENTREGADOR_DESIGNADO);

        var salva = entregaRepository.save(entrega);
        registrarHistorico(salva, null, salva.getStatus());
        return entregaMapper.toResponse(salva);
    }

    @Transactional
    public EntregaResponse atualizar(UUID id, EntregaRequest request) {
        var entrega = buscarEntidade(id);
        preencher(entrega, request);
        return entregaMapper.toResponse(entrega);
    }

    @Transactional
    public EntregaResponse alterarStatus(UUID id, EntregaStatusRequest request) {
        var entrega = buscarEntidade(id);
        var anterior = entrega.getStatus();
        entrega.setStatus(request.status());
        entrega.setConcluidaEm(request.status() == StatusEntrega.ENTREGUE ? OffsetDateTime.now() : null);
        registrarHistorico(entrega, anterior, request.status());
        return entregaMapper.toResponse(entrega);
    }

    @Transactional
    public EntregaResponse alterarStatusMinhaEntrega(UUID id, EntregaStatusRequest request) {
        var entrega = buscarEntidade(id);
        var usuario = usuarioAtual();
        if (entrega.getEntregador() == null
            || entrega.getEntregador().getUsuario() == null
            || !entrega.getEntregador().getUsuario().getId().equals(usuario.getId())) {
            throw new RecursoNaoEncontradoException("Entrega nao encontrada para este entregador");
        }

        var anterior = entrega.getStatus();
        entrega.setStatus(request.status());
        entrega.setConcluidaEm(request.status() == StatusEntrega.ENTREGUE ? OffsetDateTime.now() : null);
        registrarHistorico(entrega, anterior, request.status());
        return entregaMapper.toResponse(entrega);
    }

    @Transactional
    public EntregaResponse designarEntregador(UUID id, DesignarEntregadorRequest request) {
        var entrega = buscarEntidade(id);
        var entregador = entregadorRepository.findById(request.entregadorId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador nao encontrado"));

        var anterior = entrega.getStatus();
        entrega.setEntregador(entregador);
        entrega.setStatus(StatusEntrega.ENTREGADOR_DESIGNADO);
        registrarHistorico(entrega, anterior, StatusEntrega.ENTREGADOR_DESIGNADO);
        return entregaMapper.toResponse(entrega);
    }

    private void preencher(Entrega entrega, EntregaRequest request) {
        var cliente = clienteRepository.findById(request.clienteId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrado"));
        var config = configuracaoPrecoService.buscarAtual();
        var distancia = request.distanciaKm().setScale(2, RoundingMode.HALF_UP);
        var valorCalculado = configuracaoPrecoService.calcularValor(config, distancia);
        var valorFinal = request.valorFinal() == null
            ? valorCalculado
            : request.valorFinal().setScale(2, RoundingMode.HALF_UP);

        entrega.setCliente(cliente);
        entrega.setEntregador(request.entregadorId() == null ? null : entregadorRepository.findById(request.entregadorId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador nao encontrado")));
        entrega.setEnderecoOrigem(request.enderecoOrigem());
        entrega.setBairroOrigem(request.bairroOrigem());
        entrega.setEnderecoDestino(request.enderecoDestino());
        entrega.setBairroDestino(request.bairroDestino());
        entrega.setDestinatarioNome(request.destinatarioNome());
        entrega.setDestinatarioTelefone(request.destinatarioTelefone());
        entrega.setDescricaoMercadoria(request.descricaoMercadoria());
        entrega.setObservacoes(request.observacoes());
        entrega.setDistanciaKm(distancia);
        entrega.setTaxaInicial(config.getTaxaInicial());
        entrega.setValorPorKm(config.getValorPorKm());
        entrega.setValorCalculado(valorCalculado);
        entrega.setValorFinal(valorFinal);
        entrega.setObservacaoValorManual(valorFinal.compareTo(valorCalculado) == 0 ? null : request.observacaoValorManual());
    }

    private void registrarHistorico(Entrega entrega, StatusEntrega anterior, StatusEntrega novoStatus) {
        var historico = new HistoricoEntrega();
        historico.setEntrega(entrega);
        historico.setStatusAnterior(anterior);
        historico.setNovoStatus(novoStatus);
        historico.setUsuarioResponsavel(usuarioAtual().getUsuario());
        historicoEntregaRepository.save(historico);
        entrega.getHistorico().add(historico);
    }

    private UsuarioPrincipal usuarioAtual() {
        return (UsuarioPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Entrega buscarEntidade(UUID id) {
        return entregaRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega nao encontrada"));
    }

    private String gerarCodigo() {
        return "JSB-" + OffsetDateTime.now().toLocalDate().toString().replace("-", "")
            + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
