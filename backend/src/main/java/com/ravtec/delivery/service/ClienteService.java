package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.CriarAcessoClienteRequest;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.repository.ClienteRepository;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClienteService {
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteMapper clienteMapper;
    private final PasswordEncoder passwordEncoder;
    private final NormalizacaoService normalizacao = new NormalizacaoService();
    private final VersionamentoService versionamento = new VersionamentoService();
    @Autowired(required = false)
    private AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar(String busca) {
        var clientes = busca == null || busca.isBlank()
            ? clienteRepository.findAll()
            : clienteRepository.findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(busca, busca);
        return clientes.stream().map(clienteMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse consultar(UUID id) {
        return clienteMapper.toResponse(buscarEntidade(id));
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        var documento = validarDados(request, null);
        if (documento != null && clienteRepository.existsByDocumento(documento)) {
            throw new ConflitoException("CPF ou CNPJ ja cadastrado");
        }
        var salvo = clienteRepository.save(clienteMapper.toEntity(request));
        auditar("CLIENTE_CRIADO", salvo.getId(), null, resumo(salvo), null);
        log.info("customer_event=created customer_id={} result=success", salvo.getId());
        return clienteMapper.toResponse(salvo);
    }

    @Transactional
    public ClienteResponse atualizar(UUID id, ClienteRequest request) {
        return atualizar(id, request, null);
    }

    @Transactional
    public ClienteResponse atualizar(UUID id, ClienteRequest request, Long versao) {
        var cliente = buscarEntidade(id);
        versionamento.validar(versao, cliente.getVersion());
        var anterior = resumo(cliente);
        var documento = validarDados(request, id);
        if (documento != null && clienteRepository.existsByDocumentoAndIdNot(documento, id)) {
            throw new ConflitoException("CPF ou CNPJ ja cadastrado");
        }
        clienteMapper.updateEntity(cliente, request);
        auditar("CLIENTE_ATUALIZADO", id, anterior, resumo(cliente), null);
        return clienteMapper.toResponse(cliente);
    }

    @Transactional
    public ClienteResponse alterarStatus(UUID id, StatusRequest request) {
        return alterarStatus(id, request, null);
    }

    @Transactional
    public ClienteResponse alterarStatus(UUID id, StatusRequest request, Long versao) {
        var cliente = buscarEntidade(id);
        versionamento.validar(versao, cliente.getVersion());
        var anterior = cliente.isAtivo();
        cliente.setAtivo(request.ativo());
        auditar(request.ativo() ? "CLIENTE_ATIVADO" : "CLIENTE_DESATIVADO", id,
            Map.of("ativo", anterior), Map.of("ativo", cliente.isAtivo()), null);
        return clienteMapper.toResponse(cliente);
    }

    @Transactional
    public ClienteResponse criarAcesso(UUID id, CriarAcessoClienteRequest request) {
        var cliente = buscarEntidade(id);
        if (!cliente.isAtivo()) {
            throw new IllegalStateException("Cliente inativo nao pode receber acesso");
        }
        if (cliente.getUsuario() != null) {
            throw new IllegalArgumentException("Cliente ja possui acesso ao sistema");
        }
        var email = request.email().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new ConflitoException("E-mail ja cadastrado");
        }
        var usuario = new Usuario();
        usuario.setNome(cliente.getNome());
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(PerfilAcesso.CLIENTE);
        usuario.setAtivo(true);
        cliente.setEmail(email);
        cliente.setUsuario(usuarioRepository.save(usuario));
        auditar("USUARIO_CLIENTE_CRIADO", usuario.getId(), null,
            Map.of("email", email, "perfil", PerfilAcesso.CLIENTE.name(), "clienteId", id), null);
        return clienteMapper.toResponse(cliente);
    }

    private String validarDados(ClienteRequest request, UUID id) {
        normalizacao.telefoneObrigatorio(request.telefone());
        normalizacao.telefoneOpcional(request.whatsapp());
        var documento = normalizacao.documento(request.documento());
        if (!request.semNumero() && (request.numero() == null || request.numero().isBlank())) {
            throw new IllegalArgumentException("Informe o numero ou marque explicitamente sem numero");
        }
        if (request.cep() != null && !request.cep().isBlank() && normalizacao.digitos(request.cep()).length() != 8) {
            throw new IllegalArgumentException("CEP deve conter 8 digitos");
        }
        if (request.estado() != null && !request.estado().isBlank() && request.estado().trim().length() != 2) {
            throw new IllegalArgumentException("Estado deve conter a sigla com 2 letras");
        }
        return documento;
    }

    private Map<String, Object> resumo(com.ravtec.delivery.entity.Cliente cliente) {
        return Map.of(
            "nome", valor(cliente.getNome()), "telefone", valor(cliente.getTelefone()),
            "documento", valor(cliente.getDocumento()), "cidade", valor(cliente.getCidade()),
            "estado", valor(cliente.getEstado()), "ativo", cliente.isAtivo()
        );
    }

    private String valor(String value) {
        return value == null ? "" : value;
    }

    private void auditar(String acao, UUID id, Object antes, Object depois, String motivo) {
        if (auditoriaService != null && id != null) {
            auditoriaService.registrar(acao, "CLIENTE", id, antes, depois, motivo);
        }
    }

    private com.ravtec.delivery.entity.Cliente buscarEntidade(UUID id) {
        return clienteRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrado"));
    }
}
