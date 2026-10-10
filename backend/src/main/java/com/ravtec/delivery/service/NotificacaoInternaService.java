package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.time.OffsetDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificacaoInternaService {

    private final JdbcTemplate jdbc;
    private final IdentidadeAtual identidade;
    private final EntregaAcessoService acesso;

    public record Aviso(
        UUID id,
        UUID entregaId,
        UUID conversaId,
        String codigo,
        String evento,
        OffsetDateTime criadaEm,
        OffsetDateTime lidaEm
    ) {}

    public void evento(Entrega entrega, String evento, String chave, UUID conversaId) {
        var destinatarios = new HashSet<UUID>(
            jdbc.queryForList(
                "select id from usuarios where perfil='PROPRIETARIO' and ativo=true",
                UUID.class
            )
        );
        if (entrega.getCliente().getUsuario() != null && entrega.getCliente().isAtivo()) destinatarios.add(
            entrega.getCliente().getUsuario().getId()
        );
        var r = entrega.getEntregador();
        if (r != null && r.isAtivo() && r.getUsuario() != null && r.getUsuario().isAtivo()) destinatarios.add(
            r.getUsuario().getId()
        );
        if (conversaId != null) destinatarios.remove(identidade.principal().getId());
        for (var usuario : destinatarios)
            jdbc.update(
                "insert into notificacoes_internas(id,usuario_id,entrega_id,conversa_id,evento,chave) values(?,?,?,?,?,?) on conflict(usuario_id,chave) do " +
                    (conversaId == null ? "nothing" : "update set lida_em=null,criada_em=now()"),
                UUID.randomUUID(),
                usuario,
                entrega.getId(),
                conversaId,
                evento,
                chave
            );
    }

    @Transactional(readOnly = true)
    public List<Aviso> listar(boolean operacional, boolean naoLidas, int pagina) {
        if (pagina < 0 || pagina > 10000) throw new IllegalArgumentException("Página inválida");
        if (operacional) identidade.entregadorObrigatorio();
        var id = identidade.principal().getId();
        return jdbc.query(
            "select n.*,e.codigo from notificacoes_internas n left join entregas e on e.id=n.entrega_id left join entregadores r on r.id=e.entregador_id where n.usuario_id=? " +
                "and (n.conversa_id is null or " +
                (identidade.usuario().getPerfilEfetivo() == PerfilAcesso.PROPRIETARIO && !operacional
                        ? "true"
                        : "e.cliente_id in (select id from clientes where usuario_id=?) or r.usuario_id=? and r.ativo=true") +
                ") " +
                (operacional ? "and r.usuario_id=? and r.ativo=true " : "") +
                (naoLidas ? "and n.lida_em is null " : "") +
                "order by n.criada_em desc,n.id limit 30 offset ?",
            (rs, n) ->
                new Aviso(
                    rs.getObject("id", UUID.class),
                    rs.getObject("entrega_id", UUID.class),
                    rs.getObject("conversa_id", UUID.class),
                    rs.getString("codigo"),
                    rs.getString("evento"),
                    rs.getObject("criada_em", OffsetDateTime.class),
                    rs.getObject("lida_em", OffsetDateTime.class)
                ),
            args(operacional, id, pagina * 30)
        );
    }

    @Transactional(readOnly = true)
    public long contar(boolean operacional) {
        if (operacional) identidade.entregadorObrigatorio();
        var id = identidade.principal().getId();
        var args = new ArrayList<Object>();
        args.add(id);
        var sql =
            "select count(*) from notificacoes_internas n left join entregas e on e.id=n.entrega_id left join entregadores r on r.id=e.entregador_id where n.usuario_id=? and n.lida_em is null ";
        if (operacional) {
            sql += "and r.usuario_id=? and r.ativo=true ";
            args.add(id);
        } else if (identidade.usuario().getPerfilEfetivo() != PerfilAcesso.PROPRIETARIO) {
            sql +=
                "and (n.conversa_id is null or e.cliente_id in(select id from clientes where usuario_id=?) or r.usuario_id=? and r.ativo=true) ";
            args.add(id);
            args.add(id);
        }
        return jdbc.queryForObject(sql, Long.class, args.toArray());
    }

    private Object[] args(boolean operacional, UUID id, int offset) {
        var args = new ArrayList<Object>();
        args.add(id);
        if (identidade.usuario().getPerfilEfetivo() != PerfilAcesso.PROPRIETARIO || operacional) {
            args.add(id);
            args.add(id);
        }
        if (operacional) args.add(id);
        args.add(offset);
        return args.toArray();
    }

    @Transactional
    public void ler(UUID id, boolean operacional) {
        var entregas = jdbc.queryForList(
            "select entrega_id from notificacoes_internas where id=? and usuario_id=?",
            UUID.class,
            id,
            identidade.principal().getId()
        );
        if (entregas.isEmpty()) throw new com.ravtec.delivery.exception.RecursoNaoEncontradoException(
            "Aviso não encontrado"
        );
        if (operacional) acesso.exigirDoEntregador(entregas.getFirst());
        else acesso.exigirLeitura(entregas.getFirst());
        jdbc.update(
            "update notificacoes_internas set lida_em=coalesce(lida_em,now()) where id=? and usuario_id=?",
            id,
            identidade.principal().getId()
        );
    }

    public void resolverConversa(UUID id) {
        jdbc.update(
            "update notificacoes_internas set lida_em=now() where conversa_id=? and usuario_id=?",
            id,
            identidade.principal().getId()
        );
    }
}
