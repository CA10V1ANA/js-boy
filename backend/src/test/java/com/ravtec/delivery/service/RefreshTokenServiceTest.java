package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.RefreshTokenRepository;
import com.ravtec.delivery.security.JwtService;
import java.time.OffsetDateTime;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

class RefreshTokenServiceTest {
    @Test
    void rotacionaERevogaTokenAnterior() {
        var repository = mock(RefreshTokenRepository.class);
        var tokens = mock(TokenSeguroService.class);
        var jwt = mock(JwtService.class);
        var service = new RefreshTokenService(repository, tokens, jwt);
        ReflectionTestUtils.setField(service, "dias", 30L);
        var usuario = usuario();
        var atual = new RefreshToken();
        atual.setUsuario(usuario); atual.setFamiliaId(UUID.randomUUID());
        atual.setExpiraEm(OffsetDateTime.now().plusDays(1));
        when(tokens.hash("refresh-antigo")).thenReturn("hash-antigo");
        when(repository.findByTokenHash("hash-antigo")).thenReturn(Optional.of(atual));
        when(tokens.gerar()).thenReturn("refresh-novo");
        when(tokens.hash("refresh-novo")).thenReturn("hash-novo");
        when(jwt.gerarToken(any())).thenReturn("access-novo");

        var resposta = service.rotacionar("refresh-antigo");

        assertThat(atual.getRevogadoEm()).isNotNull();
        assertThat(atual.getSubstituidoPorHash()).isEqualTo("hash-novo");
        assertThat(resposta.refreshToken()).isEqualTo("refresh-novo");
        verify(repository).save(argThat(novo -> novo.getFamiliaId().equals(atual.getFamiliaId())));
    }

    @Test
    void reutilizacaoRevogaTodaFamilia() {
        var repository = mock(RefreshTokenRepository.class);
        var tokens = mock(TokenSeguroService.class);
        var service = new RefreshTokenService(repository, tokens, mock(JwtService.class));
        var comprometido = new RefreshToken();
        comprometido.setUsuario(usuario()); comprometido.setFamiliaId(UUID.randomUUID());
        comprometido.setExpiraEm(OffsetDateTime.now().plusDays(1));
        comprometido.setRevogadoEm(OffsetDateTime.now().minusMinutes(1));
        var irmao = new RefreshToken(); irmao.setUsuario(comprometido.getUsuario());
        when(tokens.hash("reutilizado")).thenReturn("hash");
        when(repository.findByTokenHash("hash")).thenReturn(Optional.of(comprometido));
        when(repository.findByFamiliaId(comprometido.getFamiliaId())).thenReturn(List.of(comprometido, irmao));

        assertThatThrownBy(() -> service.rotacionar("reutilizado"))
            .isInstanceOf(BadCredentialsException.class);
        assertThat(irmao.getRevogadoEm()).isNotNull();
    }

    private Usuario usuario() {
        var u = new Usuario(); u.setId(UUID.randomUUID()); u.setAtivo(true);
        u.setNome("Teste"); u.setEmail("teste@example.invalid"); u.setPerfil(PerfilAcesso.CLIENTE);
        return u;
    }
}
