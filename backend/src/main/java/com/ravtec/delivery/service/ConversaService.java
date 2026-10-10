package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ConversaDto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.*;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConversaService {

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private final ConversaRepository conversas;
    private final UsuarioRepository usuarios;
    private final EntregaFinanceiraRepository entregas;
    private final EntregaAcessoService acesso;
    private final IdentidadeAtual identidade;
    private final AuditoriaService auditoria;
    private final NotificacaoInternaService avisos;
    private final LimiteRequisicoesPublicasService limitador;

    @Value("${app.chat.post-completion-hours:48}")
    private long horas = 48;

    @Value("${app.chat.max-chars:2000}")
    private int caracteres = 2000;

    @Value("${app.chat.sends-per-minute:20}")
    private int envios = 20;

    private Entrega autorizar(UUID id, boolean operacional) {
        if (operacional) return acesso.exigirDoEntregador(id);
        if (identidade.usuario().getPerfilEfetivo() == PerfilAcesso.CLIENTE) identidade.clienteObrigatorio();
        return acesso.exigirLeitura(id);
    }

    private ConversaRepository.Registro registro(UUID id, boolean operacional) {
        var cv = conversas.buscar(id);
        if (cv == null) throw new RecursoNaoEncontradoException("Conversa não encontrada");
        autorizar(cv.entregaId(), operacional);
        return cv;
    }

    private String escopo(boolean operacional) {
        if (operacional || identidade.usuario().getPerfilEfetivo() == PerfilAcesso.ENTREGADOR) {
            identidade.entregadorObrigatorio();
            return "r.usuario_id=? and r.ativo=true";
        }
        if (identidade.usuario().getPerfilEfetivo() == PerfilAcesso.CLIENTE) {
            identidade.clienteObrigatorio();
            return "c.usuario_id=? and c.ativo=true";
        }
        if (identidade.usuario().getPerfilEfetivo() == PerfilAcesso.PROPRIETARIO) return "1=1";
        throw new AccessDeniedException("Perfil sem acesso a conversas");
    }

    private List<Object> parametros(String escopo) {
        return escopo.equals("1=1") ? List.of() : List.of(identidade.principal().getId());
    }

    @Transactional(readOnly = true)
    public List<Resumo> listar(boolean operacional, String busca, boolean naoLidas, int pagina) {
        if (pagina < 0 || pagina > 10000 || busca.length() > 100) throw new IllegalArgumentException(
            "Filtro inválido"
        );
        var filtro = escopo(operacional);
        return conversas.listar(
            filtro,
            parametros(filtro),
            identidade.principal().getId(),
            busca,
            naoLidas,
            pagina
        );
    }

    @Transactional(readOnly = true)
    public long naoLidas(boolean operacional) {
        var filtro = escopo(operacional);
        return conversas.naoLidas(filtro, parametros(filtro), identidade.principal().getId());
    }

    @Transactional
    public Detalhe abrir(UUID entregaId, boolean operacional) {
        autorizar(entregaId, operacional);
        var e = entregas.buscarParaAtualizacao(entregaId).orElseThrow();
        entityManager.refresh(e);
        autorizar(entregaId, operacional);
        if (e.getCliente().getUsuario() == null) throw new ConflitoException(
            "Conversa indisponível: cliente sem conta vinculada"
        );
        var cv = conversas.criar(entregaId);
        return detalhe(cv, e);
    }

    @Transactional(readOnly = true)
    public Detalhe consultar(UUID id, boolean operacional) {
        var cv = registro(id, operacional);
        return detalhe(cv, autorizar(cv.entregaId(), operacional));
    }

    private Detalhe detalhe(ConversaRepository.Registro cv, Entrega e) {
        var participantes = new LinkedHashMap<UUID, String>();
        var c = e.getCliente().getUsuario();
        if (c != null) participantes.put(c.getId(), c.getNome() + " (Cliente)");
        var r = e.getEntregador();
        if (r != null && r.isAtivo() && r.getUsuario() != null) participantes.put(
            r.getUsuario().getId(),
            r.getNome() + " (Entregador)"
        );
        for (var dono : usuarios.findByPerfilOrderByNomeAsc(PerfilAcesso.PROPRIETARIO))
            if (dono.isAtivo()) participantes.merge(
                dono.getId(),
                dono.getNome() + " (Proprietário)",
                (operador, proprietario) -> dono.getNome() + " (Proprietário / Entregador)"
            );
        return new Detalhe(
            cv.id(),
            e.getId(),
            e.getCodigo(),
            e.getStatus().name(),
            cv.ultimaSequencia(),
            podeEnviar(cv, e),
            prazo(cv, e),
            List.copyOf(participantes.values())
        );
    }

    private OffsetDateTime prazo(ConversaRepository.Registro cv, Entrega e) {
        if (cv.reabertaAte() != null) return cv.reabertaAte();
        if (e.getStatus() == StatusEntrega.CANCELADA) return e.getAtualizadoEm();
        return e.getConcluidaEm() == null ? null : e.getConcluidaEm().plusHours(horas);
    }

    private boolean podeEnviar(ConversaRepository.Registro cv, Entrega e) {
        if (cv.reabertaAte() != null && cv.reabertaAte().isAfter(OffsetDateTime.now())) return true;
        if (e.getStatus() == StatusEntrega.CANCELADA) return false;
        var ate = prazo(cv, e);
        return ate == null || ate.isAfter(OffsetDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<Mensagem> mensagens(UUID id, boolean operacional, Long apos, Long antes) {
        registro(id, operacional);
        if (
            (apos != null && (apos < 0 || antes != null)) || (antes != null && antes < 1)
        ) throw new IllegalArgumentException("Cursor inválido");
        var result = new ArrayList<>(conversas.mensagens(id, apos, antes));
        result.sort(Comparator.comparingLong(Mensagem::sequencia));
        return result;
    }

    @Transactional
    public Mensagem enviar(UUID id, boolean operacional, Envio request) {
        var cv = registro(id, operacional);
        var e = entregas.buscarParaAtualizacao(cv.entregaId()).orElseThrow();
        entityManager.refresh(e);
        autorizar(e.getId(), operacional);
        cv = conversas.bloquear(id);
        var conteudo = request.conteudo().trim();
        if (
            conteudo.isEmpty() || conteudo.length() > Math.min(2000, caracteres)
        ) throw new IllegalArgumentException("Mensagem fora do limite permitido");
        var anterior = conversas.envio(id, identidade.principal().getId(), request.envioId());
        if (anterior != null) {
            if (!anterior.conteudo().equals(conteudo)) throw new ConflitoException(
                "Identificador de envio já usado com outro texto"
            );
            return anterior;
        }
        if (!podeEnviar(cv, e)) throw new ConflitoException(
            "Conversa encerrada para envio; histórico disponível"
        );
        limitador.verificar(
            "chat-envio",
            identidade.principal().getId().toString(),
            envios,
            Duration.ofMinutes(1)
        );
        var contexto = operacional ? "ENTREGADOR" : identidade.usuario().getPerfilEfetivo().name();
        var mensagem = conversas.inserir(
            cv,
            identidade.principal().getId(),
            identidade.usuario().getNome(),
            contexto,
            conteudo,
            request.envioId(),
            null
        );
        avisos.evento(e, "MENSAGEM_NAO_LIDA", "chat:" + id, id);
        auditoria.registrar(
            "MENSAGEM_ENVIADA",
            "CONVERSA",
            id,
            null,
            Map.of("sequencia", mensagem.sequencia(), "contexto", contexto),
            null
        );
        return mensagem;
    }

    @Transactional
    public void ler(UUID id, boolean operacional, long sequencia) {
        var cv = registro(id, operacional);
        cv = conversas.bloquear(id);
        autorizar(cv.entregaId(), operacional);
        if (sequencia < 0 || sequencia > cv.ultimaSequencia()) throw new IllegalArgumentException(
            "Sequência de leitura inexistente"
        );
        conversas.ler(id, identidade.principal().getId(), sequencia);
        if (sequencia == cv.ultimaSequencia()) avisos.resolverConversa(id);
    }

    @Transactional
    public void reabrir(UUID id, Reabertura request) {
        if (
            identidade.usuario().getPerfilEfetivo() != PerfilAcesso.PROPRIETARIO
        ) throw new AccessDeniedException("Somente proprietário reabre conversa");
        var cv = registro(id, false);
        entregas.buscarParaAtualizacao(cv.entregaId()).orElseThrow();
        cv = conversas.bloquear(id);
        if (
            request.ate().isBefore(OffsetDateTime.now()) ||
            request.ate().isAfter(OffsetDateTime.now().plusDays(7))
        ) throw new IllegalArgumentException("Prazo deve ser futuro, até 7 dias");
        var entrega = autorizar(cv.entregaId(), false);
        if (podeEnviar(cv, entrega)) throw new ConflitoException("Conversa já permite envio");
        conversas.reabrir(id, request.ate());
        conversas.inserir(
            cv,
            null,
            null,
            "SISTEMA",
            "Conversa reaberta pelo proprietário até " + request.ate(),
            null,
            "reabertura:" + UUID.randomUUID()
        );
        auditoria.registrar(
            "CONVERSA_REABERTA",
            "CONVERSA",
            id,
            null,
            Map.of("ate", request.ate()),
            request.motivo()
        );
    }

    public void evento(Entrega e, String evento, String chave) {
        var cv = conversas.porEntrega(e.getId());
        if (cv != null) conversas.inserir(
            conversas.bloquear(cv.id()),
            null,
            null,
            "SISTEMA",
            "Entrega: " + evento.replace('_', ' ').toLowerCase(Locale.ROOT),
            null,
            chave
        );
    }
}
