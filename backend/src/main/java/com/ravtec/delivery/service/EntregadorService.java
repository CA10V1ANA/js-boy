package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.CriarAcessoEntregadorRequest;
import com.ravtec.delivery.dto.EntregadorRequest;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.EntregadorMapper;
import com.ravtec.delivery.repository.EntregadorRepository;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EntregadorService {
    private final EntregadorRepository entregadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final EntregadorMapper entregadorMapper;
    private final PasswordEncoder passwordEncoder;
    private final NormalizacaoService normalizacao = new NormalizacaoService();
    private final VersionamentoService versionamento = new VersionamentoService();
    @Autowired(required = false)
    private AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<EntregadorResponse> listar(String busca) {
        var entregadores = busca == null || busca.isBlank()
            ? entregadorRepository.findAll()
            : entregadorRepository.findByNomeContainingIgnoreCaseOrTelefoneContainingIgnoreCase(busca, busca);
        return entregadores.stream().map(entregadorMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EntregadorResponse consultar(UUID id) {
        return entregadorMapper.toResponse(buscarEntidade(id));
    }

    @Transactional
    public EntregadorResponse criar(EntregadorRequest request) {
        var cpf = validar(request);
        if (entregadorRepository.existsByCpf(cpf)) {
            throw new ConflitoException("CPF ja cadastrado");
        }
        var salvo = entregadorRepository.save(entregadorMapper.toEntity(request));
        auditar("ENTREGADOR_CRIADO", salvo.getId(), null, resumo(salvo));
        return entregadorMapper.toResponse(salvo);
    }

    @Transactional
    public EntregadorResponse atualizar(UUID id, EntregadorRequest request) {
        return atualizar(id, request, null);
    }

    @Transactional
    public EntregadorResponse atualizar(UUID id, EntregadorRequest request, Long versao) {
        var entregador = buscarEntidade(id);
        versionamento.validar(versao, entregador.getVersion());
        var anterior = resumo(entregador);
        var cpf = validar(request);
        if (entregadorRepository.existsByCpfAndIdNot(cpf, id)) {
            throw new ConflitoException("CPF ja cadastrado");
        }
        entregadorMapper.updateEntity(entregador, request);
        auditar("ENTREGADOR_ATUALIZADO", id, anterior, resumo(entregador));
        return entregadorMapper.toResponse(entregador);
    }

    @Transactional
    public EntregadorResponse alterarStatus(UUID id, StatusRequest request) {
        return alterarStatus(id, request, null);
    }

    @Transactional
    public EntregadorResponse alterarStatus(UUID id, StatusRequest request, Long versao) {
        var entregador = buscarEntidade(id);
        versionamento.validar(versao, entregador.getVersion());
        var anterior = entregador.isAtivo();
        entregador.setAtivo(request.ativo());
        auditar(request.ativo() ? "ENTREGADOR_ATIVADO" : "ENTREGADOR_DESATIVADO", id,
            Map.of("ativo", anterior), Map.of("ativo", entregador.isAtivo()));
        return entregadorMapper.toResponse(entregador);
    }

    @Transactional
    public EntregadorResponse criarAcesso(UUID id, CriarAcessoEntregadorRequest request) {
        var entregador = buscarEntidade(id);
        if (!entregador.isAtivo()) {
            throw new IllegalStateException("Entregador inativo nao pode receber acesso");
        }
        if (entregador.getUsuario() != null) {
            throw new IllegalArgumentException("Entregador ja possui acesso ao sistema");
        }
        var email = request.email().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new ConflitoException("E-mail ja cadastrado");
        }
        var usuario = new Usuario();
        usuario.setNome(entregador.getNome());
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(PerfilAcesso.ENTREGADOR);
        usuario.setAtivo(true);
        entregador.setEmail(email);
        entregador.setUsuario(usuarioRepository.save(usuario));
        auditar("USUARIO_ENTREGADOR_CRIADO", usuario.getId(), null,
            Map.of("email", email, "perfil", PerfilAcesso.ENTREGADOR.name(), "entregadorId", id));
        return entregadorMapper.toResponse(entregador);
    }

    private String validar(EntregadorRequest request) {
        normalizacao.telefoneObrigatorio(request.telefone());
        return normalizacao.cpf(request.cpf());
    }

    private Map<String, Object> resumo(com.ravtec.delivery.entity.Entregador item) {
        return Map.of(
            "nome", item.getNome(), "cpf", item.getCpf(), "telefone", item.getTelefone(),
            "ativo", item.isAtivo(), "disponivel", item.isDisponivel()
        );
    }

    private void auditar(String acao, UUID id, Object antes, Object depois) {
        if (auditoriaService != null && id != null) {
            auditoriaService.registrar(acao, "ENTREGADOR", id, antes, depois, null);
        }
    }

    private com.ravtec.delivery.entity.Entregador buscarEntidade(UUID id) {
        return entregadorRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador nao encontrado"));
    }
}
