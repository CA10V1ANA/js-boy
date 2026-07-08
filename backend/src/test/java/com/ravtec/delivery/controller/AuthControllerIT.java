package com.ravtec.delivery.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.LoginRequest;
import com.ravtec.delivery.dto.LoginResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
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
}
