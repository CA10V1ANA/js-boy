package com.ravtec.delivery.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.dto.ClienteResponse;
import com.ravtec.delivery.dto.LoginRequest;
import com.ravtec.delivery.dto.LoginResponse;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

class ClienteControllerIT extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String token;
    private static final String OWNER_EMAIL = "owner-clientes-it@jsboy.test";
    private static final String OWNER_PASSWORD = "senha-segura-it";

    @BeforeEach
    void autenticar() {
        usuarioRepository.findByEmail(OWNER_EMAIL).orElseGet(() -> {
            var usuario = new Usuario();
            usuario.setNome("Proprietario Clientes IT");
            usuario.setEmail(OWNER_EMAIL);
            usuario.setSenhaHash(passwordEncoder.encode(OWNER_PASSWORD));
            usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
            usuario.setAtivo(true);
            return usuarioRepository.save(usuario);
        });
        var login = restTemplate.postForEntity(
            "/auth/login",
            new LoginRequest(OWNER_EMAIL, OWNER_PASSWORD),
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

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
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
