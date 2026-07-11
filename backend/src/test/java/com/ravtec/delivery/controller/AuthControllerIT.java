package com.ravtec.delivery.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.LoginRequest;
import com.ravtec.delivery.dto.LoginResponse;
import com.ravtec.delivery.dto.UsuarioAutenticadoResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

class AuthControllerIT extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void deveAutenticarUsuarioProprietarioInicialComSucesso() {
        var response = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest("proprietario@jsboy.com", "admin123"),
            LoginResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isNotBlank();
        assertThat(response.getBody().usuario().email()).isEqualTo("proprietario@jsboy.com");
    }

    @Test
    void deveRejeitarLoginComSenhaInvalida() {
        var response = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest("proprietario@jsboy.com", "senha-errada"),
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
            new LoginRequest("proprietario@jsboy.com", "admin123"),
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
        assertThat(response.getBody().email()).isEqualTo("proprietario@jsboy.com");
        assertThat(response.getBody().perfil().name()).isEqualTo("PROPRIETARIO");
    }

    @Test
    void deveRejeitarConsultaDeUsuarioSemToken() {
        var response = restTemplate.getForEntity("/auth/me", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
