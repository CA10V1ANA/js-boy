package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.ParadaEntregaRepository;
import java.time.OffsetDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ParadaEntregaService {
    private final ParadaEntregaRepository repository;
    private final EntregaAcessoService acessoService;
    private final NormalizacaoService normalizacaoService;
    private final AuditoriaService auditoriaService;
    private final com.ravtec.delivery.repository.EntregaFinanceiraRepository entregas;
    private final com.ravtec.delivery.security.IdentidadeAtual identidade;
    private final RecebimentoService recebimentos;

    @Transactional
    public List<ParadaResponse> substituir(Entrega entrega, List<ParadaRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            requests = List.of(
                new ParadaRequest(1, TipoParada.COLETA, entrega.getEnderecoOrigem(), null, false, null,
                    entrega.getBairroOrigem(), null, null, null, null, null, null, null),
                new ParadaRequest(2, TipoParada.ENTREGA, entrega.getEnderecoDestino(), null, false, null,
                    entrega.getBairroDestino(), null, null, null, entrega.getDestinatarioNome(),
                    entrega.getDestinatarioTelefone(), null, null)
            );
        }
        validarOrdem(requests);
        var existentes = repository.findByEntregaIdOrderByOrdem(entrega.getId());
        if (!existentes.isEmpty()) {
            throw new IllegalStateException("Paradas existentes não podem ser substituídas silenciosamente");
        }
        var entidades = requests.stream().sorted(Comparator.comparing(ParadaRequest::ordem))
            .map(request -> criar(entrega, request)).toList();
        projetar(entrega, entidades);
        return repository.saveAll(entidades).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ParadaResponse> listar(UUID entregaId) {
        acessoService.exigirLeitura(entregaId);
        return repository.findByEntregaIdOrderByOrdem(entregaId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ParadaResponse concluirMinhaParada(UUID entregaId, UUID paradaId, Long versao) {
        var entrega = entregas.buscarParaAtualizacao(entregaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega não encontrada"));
        var perfil = identidade.usuario().getPerfilEfetivo();
        if (perfil != PerfilAcesso.PROPRIETARIO) acessoService.exigirDoEntregador(entregaId);
        if (!EnumSet.of(StatusEntrega.ENTREGADOR_DESIGNADO, StatusEntrega.COLETADA,
            StatusEntrega.EM_ROTA, StatusEntrega.TENTATIVA_FALHOU).contains(entrega.getStatus()))
            throw new IllegalStateException("Entrega não está em operação");
        if (entrega.getEntregador() == null) throw new IllegalStateException("Designe um entregador");
        var paradas = repository.findByEntregaIdOrderByOrdem(entregaId);
        var parada = paradas.stream().filter(item -> item.getId().equals(paradaId)).findFirst()
            .orElseThrow(() -> new RecursoNaoEncontradoException("Parada não encontrada"));
        if (parada.getStatus() == StatusParada.CONCLUIDA) return toResponse(parada);
        if (versao == null || !Objects.equals(versao, parada.getVersion())) {
            throw new IllegalStateException("A parada foi alterada; recarregue os dados");
        }
        boolean anteriorPendente = paradas.stream()
            .anyMatch(item -> item.getOrdem() < parada.getOrdem() && item.getStatus() != StatusParada.CONCLUIDA);
        if (anteriorPendente) {
            throw new IllegalStateException("Conclua as paradas anteriores primeiro");
        }
        if (parada.getTipo() == TipoParada.ENTREGA && entrega.getStatus() != StatusEntrega.EM_ROTA)
            throw new IllegalStateException("Inicie a rota antes de concluir uma entrega");
        parada.setStatus(StatusParada.CONCLUIDA);
        parada.setRealizadaEm(OffsetDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
        parada.setUsuarioConclusao(identidade.usuario());
        auditoriaService.registrar("PARADA_CONCLUIDA", "PARADA", parada.getId(), null,
            Map.of("entregaId", entrega.getId(), "ordem", parada.getOrdem()), null);
        repository.flush();
        return toResponse(parada);
    }

    @Transactional
    public List<ParadaResponse> editar(UUID id, Long versao, EditarRotaRequest request) {
        var e = entregas.buscarParaAtualizacao(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega não encontrada"));
        if (identidade.usuario().getPerfilEfetivo() != PerfilAcesso.PROPRIETARIO)
            throw new org.springframework.security.access.AccessDeniedException("Somente proprietário edita a rota");
        new VersionamentoService().validar(versao, e.getVersion());
        new EntregaStatusPolicy().validarEdicaoAntesDaColeta(e.getStatus());
        recebimentos.exigirSemRecebimento(e);
        var locais = request.paradas().stream().map(EditarRotaRequest.Item::local).toList();
        validarOrdem(locais);
        if (locais.size() > 2 && e.getValorNegociado() == null)
            throw new IllegalArgumentException("Informe um valor negociado explícito para a rota com vários locais");
        if (locais.size() > 2 && e.getValorFinal().compareTo(e.getValorNegociado()
            .add(e.getTaxaRetornoAplicada()).add(e.getTaxaEsperaAplicada())) != 0
            && (e.getObservacaoValorManual() == null || e.getObservacaoValorManual().isBlank()))
            throw new IllegalArgumentException("Confirme o valor final negociado ou justifique o ajuste manual antes de adicionar locais");
        var antigas = repository.findByEntregaIdOrderByOrdem(id);
        if (antigas.stream().anyMatch(p -> p.getStatus() != StatusParada.PENDENTE))
            throw new IllegalStateException("Uma rota já executada não pode ser substituída");
        var porId = new HashMap<UUID, ParadaEntrega>();
        antigas.forEach(p -> porId.put(p.getId(), p));
        var utilizados = new HashSet<UUID>();
        for (var item : request.paradas()) {
            if (item.id() != null) {
                var p = porId.get(item.id());
                if (p == null || !utilizados.add(item.id())) throw new IllegalArgumentException("Parada inválida ou repetida");
                if (item.versao() == null) throw new IllegalArgumentException("Informe a versão de cada parada existente");
                new VersionamentoService().validar(item.versao(), p.getVersion());
            }
        }
        // Temporary orders avoid the existing (delivery, order) unique constraint during reorder.
        for (int i = 0; i < antigas.size(); i++) antigas.get(i).setOrdem(-i - 1);
        repository.flush();
        repository.deleteAll(antigas.stream().filter(p -> !utilizados.contains(p.getId())).toList());
        repository.flush();
        var novas = request.paradas().stream().sorted(Comparator.comparing(item -> item.local().ordem()))
            .map(item -> {
                var p = item.id() == null ? new ParadaEntrega() : porId.get(item.id());
                preencher(p, e, item.local());
                return p;
            }).toList();
        repository.saveAll(novas);
        projetar(e, novas);
        e.setRotaAlteradaEm(OffsetDateTime.now());
        auditoriaService.registrar("ROTA_EDITADA", "ENTREGA", id, null, Map.of("locais", novas.size()), null);
        repository.flush();
        return novas.stream().map(this::toResponse).toList();
    }

    public boolean possuiMultiplosLocais(UUID id) {
        return repository.findByEntregaIdOrderByOrdem(id).size() > 2;
    }

    public void atualizarProjecao(Entrega entrega) {
        var paradas = repository.findByEntregaIdOrderByOrdem(entrega.getId());
        if (paradas.size() == 2 && paradas.stream().allMatch(p -> p.getStatus() == StatusParada.PENDENTE)) {
            var origem = paradas.get(0); var destino = paradas.get(1);
            if (!Objects.equals(enderecoSemBairro(origem), entrega.getEnderecoOrigem())) {
                origem.setLogradouro(entrega.getEnderecoOrigem()); origem.setNumero(null); origem.setSemNumero(false);
            }
            origem.setBairro(entrega.getBairroOrigem());
            if (!Objects.equals(enderecoSemBairro(destino), entrega.getEnderecoDestino())) {
                destino.setLogradouro(entrega.getEnderecoDestino()); destino.setNumero(null); destino.setSemNumero(false);
            }
            destino.setBairro(entrega.getBairroDestino()); destino.setContatoNome(entrega.getDestinatarioNome());
            destino.setContatoTelefone(entrega.getDestinatarioTelefone());
        } else if (!paradas.isEmpty()) {
            var origem = paradas.get(0); var destino = paradas.get(paradas.size() - 1);
            if (!Objects.equals(enderecoSemBairro(origem), entrega.getEnderecoOrigem())
                || !Objects.equals(enderecoSemBairro(destino), entrega.getEnderecoDestino())
                || !Objects.equals(origem.getBairro(), entrega.getBairroOrigem())
                || !Objects.equals(destino.getBairro(), entrega.getBairroDestino()))
                throw new IllegalArgumentException("Use a edição da sequência para alterar os endereços de uma rota com vários locais");
            projetar(entrega, paradas);
        }
    }

    private void projetar(Entrega e, List<ParadaEntrega> paradas) {
        var primeira = paradas.get(0); var ultima = paradas.get(paradas.size() - 1);
        e.setEnderecoOrigem(enderecoSemBairro(primeira)); e.setBairroOrigem(primeira.getBairro());
        e.setEnderecoDestino(enderecoSemBairro(ultima)); e.setBairroDestino(ultima.getBairro());
        if (ultima.getContatoNome() != null) e.setDestinatarioNome(ultima.getContatoNome());
        if (ultima.getContatoTelefone() != null) e.setDestinatarioTelefone(ultima.getContatoTelefone());
    }

    private String enderecoSemBairro(ParadaEntrega p) {
        return p.getLogradouro() + (p.isSemNumero() ? ", S/N" : p.getNumero() == null ? "" : ", " + p.getNumero());
    }

    private void validarOrdem(List<ParadaRequest> requests) {
        var ordenadas = requests.stream().sorted(Comparator.comparing(ParadaRequest::ordem)).toList();
        if (ordenadas.get(0).tipo() != TipoParada.COLETA || ordenadas.get(ordenadas.size() - 1).tipo() != TipoParada.ENTREGA)
            throw new IllegalArgumentException("A rota deve começar com coleta e terminar com entrega");
        var ordens = requests.stream().map(ParadaRequest::ordem).sorted().toList();
        for (int i = 0; i < ordens.size(); i++) {
            if (ordens.get(i) != i + 1) throw new IllegalArgumentException("A ordem das paradas deve ser continua");
        }
        if (requests.stream().filter(p -> p.tipo() == TipoParada.COLETA).count() < 1
            || requests.stream().filter(p -> p.tipo() == TipoParada.ENTREGA).count() < 1) {
            throw new IllegalArgumentException("Informe ao menos uma coleta e uma entrega");
        }
    }

    private ParadaEntrega criar(Entrega entrega, ParadaRequest r) {
        var p = new ParadaEntrega();
        preencher(p, entrega, r);
        return p;
    }

    private void preencher(ParadaEntrega p, Entrega entrega, ParadaRequest r) {
        p.setEntrega(entrega); p.setOrdem(r.ordem()); p.setTipo(r.tipo());
        p.setLogradouro(r.logradouro().trim()); p.setNumero(limpar(r.numero())); p.setSemNumero(r.semNumero());
        p.setComplemento(limpar(r.complemento())); p.setBairro(r.bairro().trim());
        p.setCidade(limpar(r.cidade())); p.setEstado(r.estado() == null ? null : r.estado().toUpperCase());
        p.setCep(r.cep()); p.setContatoNome(limpar(r.contatoNome()));
        p.setContatoTelefone(r.contatoTelefone() == null || r.contatoTelefone().isBlank()
            ? null : normalizacaoService.telefoneObrigatorio(r.contatoTelefone()));
        p.setObservacao(limpar(r.observacao())); p.setPrevistaEm(r.previstaEm());
    }

    private ParadaResponse toResponse(ParadaEntrega p) {
        String endereco = p.getLogradouro() + (p.isSemNumero() ? ", S/N" :
            p.getNumero() == null ? "" : ", " + p.getNumero()) + " - " + p.getBairro();
        return new ParadaResponse(p.getId(), p.getOrdem(), p.getTipo(), endereco, p.getContatoNome(),
            p.getContatoTelefone(), p.getObservacao(), p.getStatus(), p.getPrevistaEm(),
            p.getRealizadaEm(), p.getVersion(), p.getLogradouro(), p.getNumero(), p.isSemNumero(),
            p.getComplemento(), p.getBairro(), p.getCidade(), p.getEstado(), p.getCep(),
            p.getUsuarioConclusao() == null ? null : p.getUsuarioConclusao().getNome());
    }

    private String limpar(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
