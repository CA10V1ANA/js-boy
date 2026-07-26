package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.*;
import java.time.OffsetDateTime;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

class RecuperacaoSenhaServiceTest {
    @Test
    void tokenEDeUsoUnicoERevogaSessoes() {
        var usuarios = mock(UsuarioRepository.class);
        var resets = mock(PasswordResetTokenRepository.class);
        var refresh = mock(RefreshTokenRepository.class);
        var tokens = mock(TokenSeguroService.class);
        var encoder = mock(PasswordEncoder.class);
        var service = new RecuperacaoSenhaService(usuarios, resets, refresh, tokens, encoder,
            mock(PasswordResetNotifier.class));
        var usuario = new Usuario(); usuario.setId(UUID.randomUUID()); usuario.setAtivo(true);
        var reset = new PasswordResetToken(); reset.setUsuario(usuario);
        reset.setExpiraEm(OffsetDateTime.now().plusMinutes(5));
        var sessao = new RefreshToken(); sessao.setUsuario(usuario);
        when(tokens.hash("token-valido")).thenReturn("hash");
        when(resets.findByTokenHash("hash")).thenReturn(Optional.of(reset));
        when(encoder.encode(any())).thenReturn("senha-hash");
        when(refresh.findAll()).thenReturn(List.of(sessao));

        service.redefinir("token-valido", "NovaSenhaForte123");

        assertThat(reset.getUsadoEm()).isNotNull();
        assertThat(usuario.getSenhaHash()).isEqualTo("senha-hash");
        assertThat(sessao.getRevogadoEm()).isNotNull();
        assertThatThrownBy(() -> service.redefinir("token-valido", "NovaSenhaForte123"))
            .isInstanceOf(BadCredentialsException.class);
    }
}
