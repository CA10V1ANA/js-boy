package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.*;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecorrenciaEntregaService {
    private final RecorrenciaEntregaRepository repository;
    private final OcorrenciaRecorrenciaRepository ocorrenciaRepository;
    private final ClienteRepository clienteRepository;
    private final EntregaRepository entregaRepository;
    private final HistoricoEntregaRepository historicoRepository;
    private final ConfiguracaoPrecoService precoService;
    private final com.ravtec.delivery.security.IdentidadeAtual identidadeAtual;
    private final NotificacaoOutboxService notificacaoService;

    @Transactional
    public RecorrenciaResponse criar(RecorrenciaRequest r) {
        if (r.dataInicial().isBefore(LocalDate.now())) throw new IllegalArgumentException("Data inicial deve ser futura");
        if (r.dataFinal() != null && r.dataFinal().isBefore(r.dataInicial())) {
            throw new IllegalArgumentException("Data final invalida");
        }
        ZoneId.of(r.fusoHorario());
        var cliente = clienteRepository.findById(r.clienteId())
            .filter(Cliente::isAtivo).orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrado"));
        var item = new RecorrenciaEntrega();
        item.setCliente(cliente); item.setFrequencia(r.frequencia()); item.setDataInicial(r.dataInicial());
        item.setDataFinal(r.dataFinal()); item.setDiasSemana(limpar(r.diasSemana()));
        item.setFusoHorario(r.fusoHorario()); item.setHoraInicio(r.horaInicio()); item.setHoraFim(r.horaFim());
        item.setEnderecoOrigem(r.enderecoOrigem().trim()); item.setBairroOrigem(r.bairroOrigem().trim());
        item.setEnderecoDestino(r.enderecoDestino().trim()); item.setBairroDestino(r.bairroDestino().trim());
        item.setDestinatarioNome(r.destinatarioNome().trim()); item.setDestinatarioTelefone(r.destinatarioTelefone());
        item.setDescricaoMercadoria(r.descricaoMercadoria().trim()); item.setDistanciaKm(r.distanciaKm());
        return toResponse(repository.save(item));
    }

    @Transactional
    public int gerarAte(LocalDate ate) {
        if (ate.isAfter(LocalDate.now().plusMonths(3))) {
            throw new IllegalArgumentException("Gere no maximo tres meses por vez");
        }
        int geradas = 0;
        for (var recorrencia : repository.findByAtivaTrue()) {
            LocalDate fim = recorrencia.getDataFinal() == null || recorrencia.getDataFinal().isAfter(ate)
                ? ate : recorrencia.getDataFinal();
            for (LocalDate data = recorrencia.getDataInicial(); !data.isAfter(fim); data = data.plusDays(1)) {
                if (ocorreNaData(recorrencia, data)
                    && !ocorrenciaRepository.existsByRecorrenciaIdAndDataOcorrencia(recorrencia.getId(), data)) {
                    criarOcorrencia(recorrencia, data);
                    geradas++;
                }
            }
        }
        return geradas;
    }

    @Transactional
    public RecorrenciaResponse alterarAtiva(UUID id, boolean ativa) {
        var item = repository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Recorrencia nao encontrada"));
        item.setAtiva(ativa);
        return toResponse(item);
    }

    private void criarOcorrencia(RecorrenciaEntrega r, LocalDate data) {
        var config = precoService.buscarAtual();
        var distancia = r.getDistanciaKm().setScale(2, RoundingMode.HALF_UP);
        var entrega = new Entrega();
        entrega.setCodigo("JSB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        entrega.setCliente(r.getCliente()); entrega.setEnderecoOrigem(r.getEnderecoOrigem());
        entrega.setBairroOrigem(r.getBairroOrigem()); entrega.setEnderecoDestino(r.getEnderecoDestino());
        entrega.setBairroDestino(r.getBairroDestino()); entrega.setDestinatarioNome(r.getDestinatarioNome());
        entrega.setDestinatarioTelefone(r.getDestinatarioTelefone());
        entrega.setDescricaoMercadoria(r.getDescricaoMercadoria()); entrega.setDistanciaKm(distancia);
        entrega.setTaxaInicial(config.getTaxaInicial()); entrega.setValorPorKm(config.getValorPorKm());
        entrega.setValorCalculado(precoService.calcularValor(config, distancia));
        entrega.setValorFinal(entrega.getValorCalculado()); entrega.setStatus(StatusEntrega.AGENDADA);
        var zone = ZoneId.of(r.getFusoHorario());
        var inicio = r.getHoraInicio() == null ? LocalTime.of(8, 0) : r.getHoraInicio();
        var fim = r.getHoraFim() == null ? inicio.plusHours(2) : r.getHoraFim();
        entrega.setAgendadaInicio(data.atTime(inicio).atZone(zone).toOffsetDateTime());
        entrega.setAgendadaFim(data.atTime(fim).atZone(zone).toOffsetDateTime());
        entrega.setFusoHorario(r.getFusoHorario());
        entregaRepository.save(entrega);
        var historico = new HistoricoEntrega();
        historico.setEntrega(entrega); historico.setNovoStatus(StatusEntrega.AGENDADA);
        historico.setUsuarioResponsavel(identidadeAtual.usuario());
        historicoRepository.save(historico);
        var ocorrencia = new OcorrenciaRecorrencia();
        ocorrencia.setRecorrencia(r); ocorrencia.setDataOcorrencia(data); ocorrencia.setEntrega(entrega);
        ocorrenciaRepository.save(ocorrencia);
        notificacaoService.enfileirar(entrega, "ENTREGA_CONFIRMADA",
            "recorrencia:" + r.getId() + ":" + data);
    }

    private boolean ocorreNaData(RecorrenciaEntrega r, LocalDate data) {
        if (data.isBefore(r.getDataInicial())) return false;
        return switch (r.getFrequencia()) {
            case DIARIA -> true;
            case SEMANAL -> {
                String dias = r.getDiasSemana();
                yield dias == null
                    ? data.getDayOfWeek() == r.getDataInicial().getDayOfWeek()
                    : Arrays.stream(dias.split(",")).map(String::trim)
                        .anyMatch(d -> d.equalsIgnoreCase(data.getDayOfWeek().name()));
            }
            case MENSAL -> data.getDayOfMonth() == Math.min(
                r.getDataInicial().getDayOfMonth(), data.lengthOfMonth());
        };
    }

    private RecorrenciaResponse toResponse(RecorrenciaEntrega r) {
        return new RecorrenciaResponse(r.getId(), r.getCliente().getId(), r.getFrequencia(),
            r.getDataInicial(), r.getDataFinal(), r.getDiasSemana(), r.getFusoHorario(),
            r.isAtiva(), r.getVersion());
    }
    private String limpar(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
