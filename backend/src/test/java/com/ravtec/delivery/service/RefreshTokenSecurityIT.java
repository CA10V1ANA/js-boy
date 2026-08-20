package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.RefreshTokenRepository;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;

class RefreshTokenSecurityIT extends AbstractIntegrationTest {
    @Autowired private RefreshTokenService service;
    @Autowired private RefreshTokenRepository repository;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private TokenSeguroService tokens;
    private Usuario usuario;

    @BeforeEach
    void preparar() {
        var email = "refresh-security-" + UUID.randomUUID() + "@jsboy.test";
        usuario = new Usuario();
        usuario.setNome("Refresh Security");
        usuario.setEmail(email);
        usuario.setSenhaHash("not-used");
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        usuario.setAtivo(true);
        usuario = usuarios.saveAndFlush(usuario);
    }

    @Test
    void reutilizacaoRejeitadaRevogaFamiliaDeFormaDuravel() {
        var inicial = service.emitir(usuario);
        var predecessor = repository.findByTokenHash(tokens.hash(inicial.refreshToken())).orElseThrow();
        service.rotacionar(inicial.refreshToken());

        assertThatThrownBy(() -> service.rotacionar(inicial.refreshToken()))
            .isInstanceOf(BadCredentialsException.class);

        assertThat(repository.findByFamiliaId(predecessor.getFamiliaId()))
            .isNotEmpty()
            .allMatch(item -> !item.ativo());
    }

    @Test
    void duasRotacoesConcorrentesTemUmVencedorERevogamAFamilia() throws Exception {
        var inicial = service.emitir(usuario);
        var predecessor = repository.findByTokenHash(tokens.hash(inicial.refreshToken())).orElseThrow();
        var prontos = new CountDownLatch(2);
        var iniciar = new CountDownLatch(1);
        Callable<Boolean> rotacao = () -> {
            prontos.countDown();
            iniciar.await();
            try {
                service.rotacionar(inicial.refreshToken());
                return true;
            } catch (BadCredentialsException exception) {
                return false;
            }
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var primeira = executor.submit(rotacao);
            var segunda = executor.submit(rotacao);
            prontos.await();
            iniciar.countDown();

            assertThat(java.util.List.of(primeira.get(), segunda.get()).stream().filter(Boolean::booleanValue).count())
                .isEqualTo(1);
        }
        assertThat(repository.findByFamiliaId(predecessor.getFamiliaId()))
            .allMatch(item -> !item.ativo());
    }
}
