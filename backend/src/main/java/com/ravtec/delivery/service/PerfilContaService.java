package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.mapper.EntregadorMapper;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PerfilContaService {
    private final IdentidadeAtual identidade;
    private final UsuarioRepository usuarios;
    private final ClienteRepository clientes;
    private final EntregadorRepository entregadores;
    private final ClienteService clienteService;
    private final EntregadorMapper entregadorMapper;
    private final NormalizacaoService normalizacao;
    private final ChavePixService pix;
    private final VersionamentoService versionamento;
    private final AuditoriaService auditoria;
    private final JdbcTemplate jdbc;

    @Transactional
    public EntregadorResponse atualizarEntregador(PerfilEntregadorRequest dados, Long versao) {
        var usuario = usuarioParaAtualizacao();
        var entregador = identidade.entregadorObrigatorioParaAtualizacao();
        versionamento.validar(versao, entregador.getVersion());
        if (dados.nome() != null) {
            var nome = obrigatorio(dados.nome(), "Informe o nome");
            entregador.setNome(nome);
            usuario.setNome(nome);
        }
        if (dados.telefone() != null) entregador.setTelefone(normalizacao.telefoneObrigatorio(dados.telefone()));
        if (dados.email() != null) entregador.setEmail(alterarEmail(usuario, dados.email()));
        if (dados.placaVeiculo() != null) {
            var placa = dados.placaVeiculo().replaceAll("[\\s-]", "").toUpperCase(Locale.ROOT);
            if (!placa.isEmpty() && !placa.matches("[A-Z]{3}[0-9][A-Z0-9][0-9]{2}")) {
                throw new IllegalArgumentException("Placa inválida. Informe o padrão ABC1234 ou ABC1D23");
            }
            entregador.setPlacaVeiculo(placa.isEmpty() ? null : placa);
        }
        if (dados.tipoChavePix() != null || dados.chavePix() != null || dados.titularPix() != null) {
            var chave = dados.chavePix() == null ? entregador.getChavePix() : dados.chavePix();
            var titular = dados.titularPix() == null ? entregador.getTitularPix() : normalizacao.texto(dados.titularPix());
            var tipo = dados.tipoChavePix() == null ? entregador.getTipoChavePix() : dados.tipoChavePix();
            if ((chave == null || chave.isBlank()) && (titular == null || titular.isBlank())) tipo = null;
            var normalizada = pix.normalizar(tipo, chave, titular);
            entregador.setTipoChavePix(tipo);
            entregador.setChavePix(normalizada);
            entregador.setTitularPix(normalizada == null ? null : titular);
        }
        auditoria.registrar("PERFIL_ENTREGADOR_ATUALIZADO", "ENTREGADOR", entregador.getId(), null,
            Map.of("contexto", "PROPRIA_CONTA"), null);
        usuarios.flush();
        entregadores.flush();
        return entregadorMapper.toResponse(entregador);
    }

    @Transactional
    public ClienteResponse atualizarCliente(PerfilClienteRequest dados, Long versao) {
        var usuario = usuarioParaAtualizacao();
        var cliente = clientes.buscarAtivoPorUsuarioParaAtualizacao(usuario.getId())
            .orElseThrow(() -> new AccessDeniedException("Usuario cliente sem vinculo ativo"));
        versionamento.validar(versao, cliente.getVersion());
        var semNumero = dados.semNumero() == null ? cliente.isSemNumero() : dados.semNumero();
        var email = dados.email() == null ? usuario.getEmail() : alterarEmail(usuario, dados.email());
        var request = new ClienteRequest(
            cliente.getNome(), valor(dados.telefone(), cliente.getTelefone()), valor(dados.whatsapp(), cliente.getWhatsapp()),
            email, valor(dados.documento(), cliente.getDocumento()), cliente.getEndereco(),
            obrigatorio(valor(dados.bairro(), cliente.getBairro()), "Informe o bairro"),
            obrigatorio(valor(dados.cidade(), cliente.getCidade()), "Informe a cidade"), cliente.getObservacoes(),
            valor(dados.cep(), cliente.getCep()),
            obrigatorio(valor(dados.logradouro(), cliente.getLogradouro()), "Informe o logradouro"),
            valor(dados.numero(), cliente.getNumero()), valor(dados.complemento(), cliente.getComplemento()),
            valor(dados.estado(), cliente.getEstado()), semNumero
        );
        if (!semNumero && "S/N".equalsIgnoreCase(request.numero())) throw new IllegalArgumentException("Informe o número");
        usuarios.flush();
        return clienteService.atualizar(cliente.getId(), request, versao);
    }

    private Usuario usuarioParaAtualizacao() {
        return usuarios.buscarParaAtualizacao(identidade.principal().getId())
            .orElseThrow(() -> new AccessDeniedException("Usuário indisponível"));
    }

    private String alterarEmail(Usuario usuario, String valor) {
        var email = normalizacao.email(valor);
        if (email == null) throw new IllegalArgumentException("Informe o e-mail");
        usuarios.findByEmail(email).filter(outro -> !outro.getId().equals(usuario.getId()))
            .ifPresent(outro -> { throw new ConflitoException("E-mail já cadastrado"); });
        if (!email.equals(usuario.getEmail())) {
            usuario.setEmail(email);
            // Previously issued links must not restore an old address or reset credentials through it.
            jdbc.update("update verificacoes_email set usado_em=now() where usuario_id=? and usado_em is null", usuario.getId());
            jdbc.update("update password_reset_tokens set usado_em=now() where usuario_id=? and usado_em is null", usuario.getId());
            auditoria.registrar("EMAIL_ATUALIZADO", "USUARIO", usuario.getId(), null, Map.of("contexto", "PROPRIA_CONTA"), null);
        }
        return email;
    }

    private String valor(String novo, String atual) { return novo == null ? atual : novo; }
    private String obrigatorio(String valor, String mensagem) {
        var texto = normalizacao.texto(valor);
        if (texto == null) throw new IllegalArgumentException(mensagem);
        return texto;
    }
}
