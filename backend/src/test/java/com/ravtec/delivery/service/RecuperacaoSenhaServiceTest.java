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
import org.springframework.test.util.ReflectionTestUtils;

class RecuperacaoSenhaServiceTest {
    @Test
    void tokenEDeUsoUnicoERevogaSessoes() {
        var usuarios = mock(UsuarioRepository.class);
        var resets = mock(PasswordResetTokenRepository.class);
        var refresh = mock(RefreshTokenRepository.class);
        var tokens = mock(TokenSeguroService.class);
        var encoder = mock(PasswordEncoder.class);
        var service = new RecuperacaoSenhaService(usuarios, resets, refresh, tokens, encoder,
            mock(PasswordResetNotifier.class), mock(LimiteRequisicoesPublicasService.class));
        var usuario = new Usuario(); usuario.setId(UUID.randomUUID()); usuario.setAtivo(true);
        var reset = new PasswordResetToken(); reset.setUsuario(usuario);
        reset.setExpiraEm(OffsetDateTime.now().plusMinutes(5));
        var sessao = new RefreshToken(); sessao.setUsuario(usuario);
        when(tokens.hash("token-valido")).thenReturn("hash");
        when(resets.findByTokenHash("hash")).thenReturn(Optional.of(reset));
        when(encoder.encode(any())).thenReturn("senha-hash");

        service.redefinir("token-valido", "NovaSenhaForte123");

        assertThat(reset.getUsadoEm()).isNotNull();
        assertThat(usuario.getSenhaHash()).isEqualTo("senha-hash");
        verify(refresh).revogarAtivosDoUsuario(eq(usuario.getId()), any());
        assertThatThrownBy(() -> service.redefinir("token-valido", "NovaSenhaForte123"))
            .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void mantemNoMaximoUmTokenAtivoDuranteCooldown() {
        var usuarios = mock(UsuarioRepository.class);
        var resets = mock(PasswordResetTokenRepository.class);
        var refresh = mock(RefreshTokenRepository.class);
        var tokens = mock(TokenSeguroService.class);
        var notifier = mock(PasswordResetNotifier.class);
        var service = new RecuperacaoSenhaService(usuarios, resets, refresh, tokens,
            mock(PasswordEncoder.class), notifier, mock(LimiteRequisicoesPublicasService.class));
        ReflectionTestUtils.setField(service, "minutosJanela", 60L);
        ReflectionTestUtils.setField(service, "segundosCooldown", 60L);
        var usuario = new Usuario(); usuario.setId(UUID.randomUUID()); usuario.setAtivo(true);
        usuario.setEmail("user@example.invalid");
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        var salvo = new java.util.concurrent.atomic.AtomicReference<PasswordResetToken>();
        when(usuarios.findAtivoByEmailParaAtualizacao("user@example.invalid"))
            .thenReturn(Optional.of(usuario));
        when(resets.findTopByUsuarioIdOrderByCriadoEmDesc(usuario.getId()))
            .thenAnswer(invocation -> Optional.ofNullable(salvo.get()));
        when(tokens.gerar()).thenReturn("token-seguro");
        when(tokens.hash("token-seguro")).thenReturn("hash-seguro");
        when(resets.save(any())).thenAnswer(invocation -> {
            var item = invocation.getArgument(0, PasswordResetToken.class);
            item.setCriadoEm(OffsetDateTime.now()); salvo.set(item); return item;
        });

        service.solicitar("user@example.invalid", "10.0.0.1");
        service.solicitar("user@example.invalid", "10.0.0.1");

        verify(resets, times(1)).save(any());
        verify(notifier, times(1)).enviar("user@example.invalid", "token-seguro");
        verify(resets, times(1)).deleteByUsuarioId(usuario.getId());
    }
}
