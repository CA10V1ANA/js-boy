package com.ravtec.delivery.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.LoginRequest;
import com.ravtec.delivery.dto.LoginResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

class ClienteControllerIT extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private String token;

    @BeforeEach
    void autenticar() {
        var login = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest("proprietario@jsboy.com", "admin123"),
            LoginResponse.class
        );
        token = login.getBody().token();
    }

    @Test
    void deveCriarEListarClienteComUsuarioAutenticado() {
        var request = new ClienteRequest(
            "Cliente Integracao", "11999990000", null, null, null,
            "Rua dos Testes, 1", "Centro", "Sao Paulo", null
        );

        var criado = restTemplate.exchange("/clientes", org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(request, authHeaders()), ClienteResponse.class);

        assertThat(criado.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(criado.getBody().nome()).isEqualTo("Cliente Integracao");

        var lista = restTemplate.exchange("/clientes?busca=Integracao", org.springframework.http.HttpMethod.GET,
            new HttpEntity<>(authHeaders()), ClienteResponse[].class);

        assertThat(lista.getBody()).isNotEmpty();
    }

    @Test
    void deveRejeitarAcessoSemToken() {
        var response = restTemplate.getForEntity("/clientes", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void deveRetornarErroDeValidacaoQuandoCamposObrigatoriosAusentes() {
        var request = new ClienteRequest(null, null, null, null, null, null, null, null, null);

        var response = restTemplate.exchange("/clientes", org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(request, authHeaders()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private HttpHeaders authHeaders() {
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }
}
