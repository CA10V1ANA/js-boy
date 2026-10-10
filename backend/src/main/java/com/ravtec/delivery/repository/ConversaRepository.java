package com.ravtec.delivery.repository;

import com.ravtec.delivery.dto.ConversaDto.*;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ConversaRepository {

    private final JdbcTemplate jdbc;

    public record Registro(UUID id, UUID entregaId, long ultimaSequencia, OffsetDateTime reabertaAte) {}

    public Registro buscar(UUID id) {
        return jdbc
            .query("select * from conversas where id=?", (rs, n) -> registro(rs), id)
            .stream()
            .findFirst()
            .orElse(null);
    }

    public Registro porEntrega(UUID entregaId) {
        return jdbc
            .query("select * from conversas where entrega_id=?", (rs, n) -> registro(rs), entregaId)
            .stream()
            .findFirst()
            .orElse(null);
    }

    public Registro criar(UUID entregaId) {
        jdbc.update(
            "insert into conversas(id,entrega_id) values (?,?) on conflict(entrega_id) do nothing",
            UUID.randomUUID(),
            entregaId
        );
        return porEntrega(entregaId);
    }

    public Registro bloquear(UUID id) {
        return jdbc.queryForObject(
            "select * from conversas where id=? for update",
            (rs, n) -> registro(rs),
            id
        );
    }

    private Registro registro(ResultSet rs) throws SQLException {
        return new Registro(
            rs.getObject("id", UUID.class),
            rs.getObject("entrega_id", UUID.class),
            rs.getLong("ultima_sequencia"),
            rs.getObject("reaberta_ate", OffsetDateTime.class)
        );
    }

    public List<Resumo> listar(
        String escopo,
        List<Object> parametros,
        UUID usuario,
        String busca,
        boolean naoLidas,
        int pagina
    ) {
        var args = new ArrayList<Object>();
        args.add(usuario);
        args.addAll(parametros);
        args.add("%" + busca.toLowerCase(Locale.ROOT) + "%");
        args.add(pagina * 30);
        return jdbc.query(
            """
                select cv.*, e.codigo, e.status, c.nome cliente_nome, coalesce(l.sequencia,0) lida,
                    m.conteudo ultima_mensagem from conversas cv join entregas e on e.id=cv.entrega_id
                join clientes c on c.id=e.cliente_id left join entregadores r on r.id=e.entregador_id
                left join leituras_conversa l on l.conversa_id=cv.id and l.usuario_id=?
                left join mensagens_conversa m on m.conversa_id=cv.id and m.sequencia=cv.ultima_sequencia
                where """ +
                " " +
                escopo +
                " and lower(e.codigo || ' ' || c.nome || ' ' || coalesce(r.nome,'') || ' ' || e.status) like ? " +
                (naoLidas ? " and cv.ultima_sequencia>coalesce(l.sequencia,0) " : "") +
                " order by cv.atualizada_em desc,cv.id limit 30 offset ?",
            (rs, n) ->
                new Resumo(
                    rs.getObject("id", UUID.class),
                    rs.getObject("entrega_id", UUID.class),
                    rs.getString("codigo"),
                    rs.getString("cliente_nome"),
                    rs.getString("status"),
                    rs.getLong("ultima_sequencia"),
                    rs.getLong("ultima_sequencia") > rs.getLong("lida"),
                    rs.getString("ultima_mensagem"),
                    rs.getObject("atualizada_em", OffsetDateTime.class)
                ),
            args.toArray()
        );
    }

    public long naoLidas(String escopo, List<Object> parametros, UUID usuario) {
        var args = new ArrayList<Object>();
        args.add(usuario);
        args.addAll(parametros);
        return jdbc.queryForObject(
            "select count(*) from conversas cv join entregas e on e.id=cv.entrega_id join clientes c on c.id=e.cliente_id left join entregadores r on r.id=e.entregador_id left join leituras_conversa l on l.conversa_id=cv.id and l.usuario_id=? where " +
                escopo +
                " and cv.ultima_sequencia>coalesce(l.sequencia,0)",
            Long.class,
            args.toArray()
        );
    }

    public List<Mensagem> mensagens(UUID id, Long apos, Long antes) {
        return jdbc.query(
            "select * from mensagens_conversa where conversa_id=? and sequencia " +
                (apos != null ? ">" : "<") +
                " ? order by sequencia " +
                (apos != null ? "asc" : "desc") +
                " limit 60",
            (rs, n) -> mensagem(rs),
            id,
            apos != null ? apos : antes != null ? antes : Long.MAX_VALUE
        );
    }

    public Mensagem envio(UUID id, UUID autor, UUID envio) {
        return jdbc
            .query(
                "select * from mensagens_conversa where conversa_id=? and autor_id=? and envio_id=?",
                (rs, n) -> mensagem(rs),
                id,
                autor,
                envio
            )
            .stream()
            .findFirst()
            .orElse(null);
    }

    private Mensagem mensagem(ResultSet rs) throws SQLException {
        return new Mensagem(
            rs.getObject("id", UUID.class),
            rs.getLong("sequencia"),
            rs.getString("autor_nome"),
            rs.getObject("autor_id", UUID.class),
            rs.getString("contexto"),
            rs.getString("tipo"),
            rs.getString("conteudo"),
            rs.getObject("criada_em", OffsetDateTime.class),
            rs.getObject("envio_id", UUID.class)
        );
    }

    public Mensagem inserir(
        Registro cv,
        UUID autor,
        String nome,
        String contexto,
        String conteudo,
        UUID envio,
        String evento
    ) {
        if (
            evento != null &&
            Boolean.TRUE.equals(
                jdbc.queryForObject(
                    "select exists(select 1 from mensagens_conversa where conversa_id=? and evento_chave=?)",
                    Boolean.class,
                    cv.id(),
                    evento
                )
            )
        ) return null;
        long seq = cv.ultimaSequencia() + 1;
        var id = UUID.randomUUID();
        jdbc.update(
            "insert into mensagens_conversa(id,conversa_id,sequencia,autor_id,autor_nome,contexto,tipo,conteudo,envio_id,evento_chave) values(?,?,?,?,?,?,?,?,?,?)",
            id,
            cv.id(),
            seq,
            autor,
            nome,
            contexto,
            autor == null ? "SISTEMA" : "TEXTO",
            conteudo,
            envio,
            evento
        );
        jdbc.update("update conversas set ultima_sequencia=?,atualizada_em=now() where id=?", seq, cv.id());
        return jdbc.queryForObject(
            "select * from mensagens_conversa where id=?",
            (rs, n) -> mensagem(rs),
            id
        );
    }

    public void ler(UUID conversa, UUID usuario, long sequencia) {
        jdbc.update(
            "insert into leituras_conversa(conversa_id,usuario_id,sequencia) values(?,?,?) on conflict(conversa_id,usuario_id) do update set sequencia=greatest(leituras_conversa.sequencia,excluded.sequencia)",
            conversa,
            usuario,
            sequencia
        );
    }

    public void reabrir(UUID conversa, OffsetDateTime ate) {
        jdbc.update("update conversas set reaberta_ate=? where id=?", ate, conversa);
    }
}
