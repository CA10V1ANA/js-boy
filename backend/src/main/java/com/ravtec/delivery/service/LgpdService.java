package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.time.OffsetDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LgpdService {
    private final ClienteRepository clientes;
    private final EntregaRepository entregas;
    private final PagamentoRepository pagamentos;
    private final SolicitacaoTitularRepository solicitacoes;
    private final IdentidadeAtual identidadeAtual;
    private final AuditoriaService auditoria;

    @Transactional(readOnly = true)
    public Map<String, Object> exportar(UUID clienteId) {
        var cliente = buscar(clienteId);
        var doCliente = entregas.findAll().stream()
            .filter(e -> e.getCliente().getId().equals(clienteId)).toList();
        var ids = doCliente.stream().map(Entrega::getId).collect(java.util.stream.Collectors.toSet());
        var financeiros = pagamentos.findAll().stream().filter(p -> ids.contains(p.getEntrega().getId())).toList();
        return Map.of(
            "geradoEm", OffsetDateTime.now().toString(),
            "cliente", Map.of(
                "id", cliente.getId(), "nome", valor(cliente.getNome()), "email", valor(cliente.getEmail()),
                "telefone", valor(cliente.getTelefone()), "documento", valor(cliente.getDocumento()),
                "endereco", valor(cliente.getEndereco())
            ),
            "entregas", doCliente.stream().map(e -> Map.of(
                "codigo", e.getCodigo(), "status", e.getStatus(), "criadoEm", e.getCriadoEm(),
                "valorFinal", e.getValorFinal()
            )).toList(),
            "financeiro", financeiros.stream().map(p -> Map.of(
                "id", p.getId(), "tipo", p.getTipo(), "valor", p.getValor(), "pagoEm", p.getPagoEm()
            )).toList()
        );
    }

    @Transactional
    public UUID registrar(UUID clienteId, TipoSolicitacaoTitular tipo, String justificativa) {
        var item = new SolicitacaoTitular();
        item.setCliente(buscar(clienteId)); item.setTipo(tipo);
        item.setJustificativa(limpar(justificativa)); item.setUsuarioResponsavel(identidadeAtual.usuario());
        solicitacoes.save(item);
        auditoria.registrar("SOLICITACAO_TITULAR_REGISTRADA", "CLIENTE", clienteId, null,
            Map.of("solicitacaoId", item.getId(), "tipo", tipo), justificativa);
        return item.getId();
    }

    @Transactional
    public void anonimizar(UUID clienteId, String justificativa) {
        if (justificativa == null || justificativa.isBlank()) {
            throw new IllegalArgumentException("Justificativa obrigatoria");
        }
        var cliente = buscar(clienteId);
        var pedido = new SolicitacaoTitular();
        pedido.setCliente(cliente); pedido.setTipo(TipoSolicitacaoTitular.ANONIMIZACAO);
        pedido.setStatus(StatusSolicitacaoTitular.CONCLUIDA); pedido.setConcluidaEm(OffsetDateTime.now());
        pedido.setJustificativa(justificativa.trim()); pedido.setUsuarioResponsavel(identidadeAtual.usuario());
        solicitacoes.save(pedido);
        String sufixo = cliente.getId().toString().substring(0, 8);
        cliente.setNome("Cliente anonimizado " + sufixo); cliente.setTelefone("0000000000");
        cliente.setWhatsapp(null); cliente.setEmail(null); cliente.setDocumento(null);
        cliente.setEndereco("Dados anonimizados"); cliente.setLogradouro("Dados anonimizados");
        cliente.setNumero("S/N"); cliente.setSemNumero(true); cliente.setComplemento(null);
        cliente.setBairro("Nao informado"); cliente.setCidade("Nao informado"); cliente.setEstado(null);
        cliente.setCep(null); cliente.setObservacoes(null); cliente.setAtivo(false);
        if (cliente.getUsuario() != null) {
            cliente.getUsuario().setNome(cliente.getNome());
            cliente.getUsuario().setEmail("anon-" + cliente.getId() + "@invalid.local");
            cliente.getUsuario().setAtivo(false);
        }
        auditoria.registrar("CLIENTE_ANONIMIZADO", "CLIENTE", clienteId, null,
            Map.of("solicitacaoId", pedido.getId()), justificativa);
    }

    private Cliente buscar(UUID id) {
        return clientes.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrado"));
    }
    private String valor(Object value) { return value == null ? "" : value.toString(); }
    private String limpar(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
