package com.ravtec.delivery.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.LoginRequest;
import com.ravtec.delivery.dto.LoginResponse;
import com.ravtec.delivery.dto.UsuarioAutenticadoResponse;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthControllerIT extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String OWNER_EMAIL = "owner-auth-it@jsboy.test";
    private static final String OWNER_PASSWORD = "senha-segura-it";

    @BeforeEach
    void prepararProprietario() {
        restTemplate.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());

        var usuario = usuarioRepository.findByEmail(OWNER_EMAIL).orElseGet(() -> {
            var novo = new Usuario();
            novo.setNome("Proprietario Integracao");
            novo.setEmail(OWNER_EMAIL);
            return novo;
        });
        usuario.setSenhaHash(passwordEncoder.encode(OWNER_PASSWORD));
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        usuario.setAtivo(true);
        usuarioRepository.saveAndFlush(usuario);
    }

    @Test
    void deveAutenticarUsuarioProprietarioComSucesso() {
        var response = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest(OWNER_EMAIL, OWNER_PASSWORD),
            LoginResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isNotBlank();
        assertThat(response.getBody().usuario().email()).isEqualTo(OWNER_EMAIL);
    }

    @Test
    void deveRejeitarLoginComSenhaInvalida() {
        var response = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest(OWNER_EMAIL, "senha-errada"),
            String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void deveRejeitarLoginComEmailInexistente() {
        var response = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest("naoexiste@jsboy.com", "qualquer"),
            String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void deveRetornarUsuarioAutenticadoComTokenValido() {
        var login = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest(OWNER_EMAIL, OWNER_PASSWORD),
            LoginResponse.class
        );
        var token = login.getBody().token();

        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        var response = restTemplate.exchange(
            "/auth/me",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            UsuarioAutenticadoResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().email()).isEqualTo(OWNER_EMAIL);
        assertThat(response.getBody().perfil().name()).isEqualTo("PROPRIETARIO");
    }

    @Test
    void deveRejeitarConsultaDeUsuarioSemToken() {
        var response = restTemplate.getForEntity("/auth/me", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void deveRejeitarImediatamenteJwtEmitidoAntesDaDesativacao() {
        var login = restTemplate.postForEntity(
            "/auth/login", new LoginRequest(OWNER_EMAIL, OWNER_PASSWORD), LoginResponse.class
        );
        var usuario = usuarioRepository.findByEmail(OWNER_EMAIL).orElseThrow();
        usuario.setAtivo(false);
        usuarioRepository.saveAndFlush(usuario);

        var headers = new HttpHeaders();
        headers.setBearerAuth(login.getBody().token());
        var response = restTemplate.exchange(
            "/auth/me", HttpMethod.GET, new HttpEntity<>(headers), String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
