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
import org.springframework.beans.factory.annotation.Value;
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
    private final EntregaService entregaService;
    @Value("${app.business-zone:America/Fortaleza}") private String zona;

    @Transactional
    public RecorrenciaResponse criar(RecorrenciaRequest r) {
        if (r.dataInicial().isBefore(LocalDate.now(ZoneId.of(zona)))) throw new IllegalArgumentException("Data inicial deve ser futura");
        if (r.dataFinal() != null && r.dataFinal().isBefore(r.dataInicial())) {
            throw new IllegalArgumentException("Data final invalida");
        }
        ZoneId.of(r.fusoHorario());
        var cliente = clienteRepository.findById(r.clienteId())
            .filter(Cliente::isAtivo).orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado"));
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
        if (ate.isAfter(LocalDate.now(ZoneId.of(zona)).plusMonths(3))) {
            throw new IllegalArgumentException("Gere no maximo tres meses por vez");
        }
        int geradas = 0;
        for (var recorrencia : repository.findByAtivaTrue()) {
            LocalDate fim = recorrencia.getDataFinal() == null || recorrencia.getDataFinal().isAfter(ate)
                ? ate : recorrencia.getDataFinal();
            LocalDate inicio = recorrencia.getGeradaAte() == null ? recorrencia.getDataInicial()
                : recorrencia.getGeradaAte().plusDays(1);
            for (LocalDate data = inicio; !data.isAfter(fim); data = data.plusDays(1)) {
                if (ocorreNaData(recorrencia, data)
                    && !ocorrenciaRepository.existsByRecorrenciaIdAndDataOcorrencia(recorrencia.getId(), data)) {
                    criarOcorrencia(recorrencia, data);
                    geradas++;
                }
            }
            if (!fim.isBefore(inicio)) recorrencia.setGeradaAte(fim);
        }
        return geradas;
    }

    @Transactional
    public RecorrenciaResponse alterarAtiva(UUID id, boolean ativa) {
        var item = repository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Recorrência não encontrada"));
        item.setAtiva(ativa);
        return toResponse(item);
    }

    private void criarOcorrencia(RecorrenciaEntrega r, LocalDate data) {
        var criada = entregaService.criar(new EntregaRequest(
            r.getCliente().getId(), null, r.getEnderecoOrigem(), r.getBairroOrigem(),
            r.getEnderecoDestino(), r.getBairroDestino(), r.getDestinatarioNome(),
            r.getDestinatarioTelefone(), r.getDescricaoMercadoria(), null,
            r.getDistanciaKm(), null, null), null, StatusEntrega.AGENDADA);
        var entrega = entregaRepository.findById(criada.id()).orElseThrow();
        var zone = ZoneId.of(r.getFusoHorario());
        var inicio = r.getHoraInicio() == null ? LocalTime.of(8, 0) : r.getHoraInicio();
        var fim = r.getHoraFim() == null ? inicio.plusHours(2) : r.getHoraFim();
        entrega.setAgendadaInicio(data.atTime(inicio).atZone(zone).toOffsetDateTime());
        entrega.setAgendadaFim(data.atTime(fim).atZone(zone).toOffsetDateTime());
        entrega.setFusoHorario(r.getFusoHorario());
        entregaRepository.save(entrega);
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
