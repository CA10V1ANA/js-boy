package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.EnderecoClienteDto.*;
import com.ravtec.delivery.exception.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EnderecoClienteService {

    private final JdbcTemplate jdbc;
    private final IdentidadeAtual identidade;
    private final NormalizacaoService normalizacao;

    @Transactional(readOnly = true)
    public List<Registro> listar() {
        return jdbc.query(
            "select * from enderecos_cliente where cliente_id=? order by apelido,id limit 100",
            (r, n) ->
                new Registro(
                    r.getObject("id", UUID.class),
                    r.getString("apelido"),
                    r.getString("endereco"),
                    r.getString("bairro"),
                    r.getString("cidade"),
                    r.getString("estado"),
                    r.getString("cep"),
                    r.getString("complemento"),
                    r.getString("referencia"),
                    r.getString("contato_nome"),
                    r.getString("contato_telefone"),
                    r.getLong("versao")
                ),
            identidade.clienteObrigatorio().getId()
        );
    }

    @Transactional
    public UUID salvar(UUID id, Long versao, Dados d) {
        var cliente = identidade.clienteObrigatorio().getId();
        var telefone = d.contatoTelefone() == null || d.contatoTelefone().isBlank()
            ? null
            : normalizacao.telefoneObrigatorio(d.contatoTelefone());
        if (id == null) {
            jdbc.queryForObject("select id from clientes where id=? for update", UUID.class, cliente);
            if (
                jdbc.queryForObject(
                    "select count(*) from enderecos_cliente where cliente_id=?",
                    Long.class,
                    cliente
                ) >=
                100
            ) throw new ConflitoException("Limite de 100 endereços por cliente");
            id = UUID.randomUUID();
            jdbc.update(
                "insert into enderecos_cliente(id,cliente_id,apelido,endereco,bairro,cidade,estado,cep,complemento,referencia,contato_nome,contato_telefone) values(?,?,?,?,?,?,?,?,?,?,?,?)",
                id,
                cliente,
                d.apelido().trim(),
                d.endereco().trim(),
                d.bairro().trim(),
                d.cidade().trim(),
                d.estado().toUpperCase(Locale.ROOT),
                d.cep(),
                d.complemento(),
                d.referencia(),
                d.contatoNome(),
                telefone
            );
        } else if (
            jdbc.update(
                "update enderecos_cliente set apelido=?,endereco=?,bairro=?,cidade=?,estado=?,cep=?,complemento=?,referencia=?,contato_nome=?,contato_telefone=?,versao=versao+1 where id=? and cliente_id=? and versao=?",
                d.apelido().trim(),
                d.endereco().trim(),
                d.bairro().trim(),
                d.cidade().trim(),
                d.estado().toUpperCase(Locale.ROOT),
                d.cep(),
                d.complemento(),
                d.referencia(),
                d.contatoNome(),
                telefone,
                id,
                cliente,
                versao
            ) !=
            1
        ) throw new RecursoNaoEncontradoException("Endereço indisponível ou alterado; recarregue");
        return id;
    }

    @Transactional
    public void excluir(UUID id, Long versao) {
        if (
            jdbc.update(
                "delete from enderecos_cliente where id=? and cliente_id=? and versao=?",
                id,
                identidade.clienteObrigatorio().getId(),
                versao
            ) !=
            1
        ) throw new RecursoNaoEncontradoException("Endereço indisponível ou alterado; recarregue");
    }
}
