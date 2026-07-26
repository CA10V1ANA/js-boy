package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.RefreshTokenRepository;
import com.ravtec.delivery.security.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository repository;
    private final TokenSeguroService tokens;
    private final JwtService jwtService;
    @Value("${app.security.refresh-days:30}") private long dias;

    @Transactional
    public LoginResponse emitir(Usuario usuario) {
        return emitir(usuario, UUID.randomUUID());
    }

    @Transactional
    public LoginResponse rotacionar(String token) {
        var atual = repository.findByTokenHash(tokens.hash(token))
            .orElseThrow(() -> new BadCredentialsException("Sessao invalida"));
        if (!atual.ativo()) {
            repository.findByFamiliaId(atual.getFamiliaId()).forEach(item -> item.setRevogadoEm(OffsetDateTime.now()));
            throw new BadCredentialsException("Sessao invalida");
        }
        atual.setRevogadoEm(OffsetDateTime.now());
        var resposta = emitir(atual.getUsuario(), atual.getFamiliaId());
        atual.setSubstituidoPorHash(tokens.hash(resposta.refreshToken()));
        return resposta;
    }

    @Transactional
    public void revogar(String token) {
        repository.findByTokenHash(tokens.hash(token))
            .ifPresent(item -> item.setRevogadoEm(OffsetDateTime.now()));
    }

    private LoginResponse emitir(Usuario usuario, UUID familia) {
        String refresh = tokens.gerar();
        var entidade = new RefreshToken();
        entidade.setUsuario(usuario); entidade.setTokenHash(tokens.hash(refresh));
        entidade.setFamiliaId(familia); entidade.setExpiraEm(OffsetDateTime.now().plusDays(dias));
        repository.save(entidade);
        return new LoginResponse(jwtService.gerarToken(new UsuarioPrincipal(usuario)), refresh,
            UsuarioAutenticadoResponse.from(usuario));
    }
}
