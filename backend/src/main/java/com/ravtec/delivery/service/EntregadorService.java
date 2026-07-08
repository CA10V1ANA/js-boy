package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.CriarAcessoEntregadorRequest;
import com.ravtec.delivery.dto.EntregadorRequest;
import com.ravtec.delivery.dto.EntregadorResponse;
import com.ravtec.delivery.dto.StatusRequest;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.EntregadorMapper;
import com.ravtec.delivery.repository.EntregadorRepository;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EntregadorService {

    private final EntregadorRepository entregadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final EntregadorMapper entregadorMapper;
    private final PasswordEncoder passwordEncoder;

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
        var entregador = entregadorMapper.toEntity(request);
        var salvo = entregadorRepository.save(entregador);
        log.info("Entregador criado: id={} nome={}", salvo.getId(), salvo.getNome());
        return entregadorMapper.toResponse(salvo);
    }

    @Transactional
    public EntregadorResponse atualizar(UUID id, EntregadorRequest request) {
        var entregador = buscarEntidade(id);
        entregadorMapper.updateEntity(entregador, request);
        return entregadorMapper.toResponse(entregador);
    }

    @Transactional
    public EntregadorResponse alterarStatus(UUID id, StatusRequest request) {
        var entregador = buscarEntidade(id);
        entregador.setAtivo(request.ativo());
        return entregadorMapper.toResponse(entregador);
    }

    @Transactional
    public EntregadorResponse criarAcesso(UUID id, CriarAcessoEntregadorRequest request) {
        var entregador = buscarEntidade(id);
        if (entregador.getUsuario() != null) {
            throw new IllegalArgumentException("Entregador ja possui acesso ao sistema");
        }
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("E-mail ja cadastrado");
        }

        var usuario = new Usuario();
        usuario.setNome(entregador.getNome());
        usuario.setEmail(request.email());
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(PerfilAcesso.ENTREGADOR);
        usuario.setAtivo(true);

        entregador.setEmail(request.email());
        entregador.setUsuario(usuarioRepository.save(usuario));
        log.info("Acesso criado para entregador: id={} email={}", entregador.getId(), request.email());
        return entregadorMapper.toResponse(entregador);
    }

    private com.ravtec.delivery.entity.Entregador buscarEntidade(UUID id) {
        return entregadorRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Entregador nao encontrado"));
    }
}
