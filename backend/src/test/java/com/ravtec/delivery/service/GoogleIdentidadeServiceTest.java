package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

class GoogleIdentidadeServiceTest {

    private static KeyPair key;
    private GoogleIdentidadeService service;

    @BeforeAll
    static void chaves() throws Exception {
        var generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        key = generator.generateKeyPair();
    }

    @BeforeEach
    void preparar() {
        service = new GoogleIdentidadeService(new ObjectMapper(), RestClient.builder(), "cliente-teste");
        ReflectionTestUtils.setField(service, "chaves", Map.of("teste", (RSAPublicKey) key.getPublic()));
        ReflectionTestUtils.setField(service, "expira", Instant.now().plusSeconds(600));
        ReflectionTestUtils.setField(service, "ultimaBusca", Instant.now());
    }

    private JwtBuilder token() {
        return Jwts.builder()
            .header()
            .keyId("teste")
            .and()
            .issuer("https://accounts.google.com")
            .audience()
            .add("cliente-teste")
            .and()
            .subject("google-sub-estavel")
            .expiration(Date.from(Instant.now().plusSeconds(300)))
            .claim("email", "CLIENTE@example.invalid")
            .claim("email_verified", true);
    }

    private String assinar(JwtBuilder b) {
        return b.signWith(key.getPrivate(), Jwts.SIG.RS256).compact();
    }

    @Test
    void aceitaSomenteIdentidadeAssinadaComEmailVerificado() {
        var i = service.verificar(assinar(token()));
        assertThat(i.sub()).isEqualTo("google-sub-estavel");
        assertThat(i.email()).isEqualTo("cliente@example.invalid");
    }

    @Test
    void rejeitaAudienciaDeOutroAplicativo() {
        assertThatThrownBy(() ->
            service.verificar(assinar(token().audience().clear().add("outro").and()))
        ).isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void rejeitaEmissorFalso() {
        assertThatThrownBy(() ->
            service.verificar(assinar(token().issuer("https://falso.invalid")))
        ).isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void rejeitaExpirado() {
        assertThatThrownBy(() ->
            service.verificar(assinar(token().expiration(Date.from(Instant.now().minusSeconds(1)))))
        ).isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void rejeitaEmailNaoVerificadoESubAusente() {
        assertThatThrownBy(() ->
            service.verificar(assinar(token().claim("email_verified", false)))
        ).isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> service.verificar(assinar(token().subject("")))).isInstanceOf(
            BadCredentialsException.class
        );
    }

    @Test
    void rejeitaAssinaturaAdulteradaEAlgoritmoDiferente() throws Exception {
        var outro = KeyPairGenerator.getInstance("RSA");
        outro.initialize(2048);
        assertThatThrownBy(() ->
            service.verificar(
                token().signWith(outro.generateKeyPair().getPrivate(), Jwts.SIG.RS256).compact()
            )
        ).isInstanceOf(BadCredentialsException.class);
        var hs = Jwts.SIG.HS256.key().build();
        assertThatThrownBy(() -> service.verificar(token().signWith(hs).compact())).isInstanceOf(
            BadCredentialsException.class
        );
    }

    @Test
    void rejeitaChaveDesconhecidaSemAceitarTokenOuBuscarUrlDoCliente() {
        assertThatThrownBy(() ->
            service.verificar(assinar(token().header().keyId("outra").and()))
        ).isInstanceOf(BadCredentialsException.class);
    }
}
