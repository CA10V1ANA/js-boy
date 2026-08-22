package com.ravtec.delivery.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    private static final String EMAIL = "owner@jsboy.test";
    private static final String PASSWORD = "test-only-owner-password";

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void criaProprietarioSomenteQuandoBancoEstaVazio() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(usuarioRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(PASSWORD)).thenReturn("hash-seguro");

        new DataInitializer(usuarioRepository, passwordEncoder, EMAIL, PASSWORD).run();

        var captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        var criado = captor.getValue();
        assertEquals("Proprietario JS Boy", criado.getNome());
        assertEquals(EMAIL, criado.getEmail());
        assertEquals("hash-seguro", criado.getSenhaHash());
        assertEquals(PerfilAcesso.PROPRIETARIO, criado.getPerfil());
    }

    @Test
    void reinicioEhIdempotenteQuandoMesmoProprietarioJaExiste() {
        var existente = new Usuario();
        existente.setEmail(EMAIL);
        existente.setPerfil(PerfilAcesso.PROPRIETARIO);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existente));

        new DataInitializer(usuarioRepository, passwordEncoder, EMAIL, PASSWORD).run();

        verify(usuarioRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(passwordEncoder, never()).encode(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void recusaBootstrapEmBancoQueJaPossuiOutrosUsuarios() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(usuarioRepository.count()).thenReturn(1L);

        assertThrows(
            IllegalStateException.class,
            () -> new DataInitializer(usuarioRepository, passwordEncoder, EMAIL, PASSWORD).run()
        );

        verify(usuarioRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void recusaEmailQueJaPertenceAOutroPerfil() {
        var existente = new Usuario();
        existente.setEmail(EMAIL);
        existente.setPerfil(PerfilAcesso.CLIENTE);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existente));

        assertThrows(
            IllegalStateException.class,
            () -> new DataInitializer(usuarioRepository, passwordEncoder, EMAIL, PASSWORD).run()
        );

        verify(usuarioRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void exigeSenhaInicialComDozeCaracteres() {
        assertThrows(
            IllegalStateException.class,
            () -> new DataInitializer(usuarioRepository, passwordEncoder, EMAIL, "curta123").run()
        );

        verify(usuarioRepository, never()).findByEmail(org.mockito.ArgumentMatchers.anyString());
    }
}