package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class ResendEmailClientTest {
    @Test void recusaConfiguracaoQueNaoPodeEntregarRecuperacaoDeSenha() {
        assertThatThrownBy(() -> new ResendEmailClient(RestClient.builder(), "", "sender@example.invalid", "local", "resend"))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("RESEND_API_KEY");
        assertThatThrownBy(() -> new ResendEmailClient(RestClient.builder(), "test-only", "", "resend", "local"))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("RESEND_FROM");
        assertThatCode(() -> new ResendEmailClient(RestClient.builder(), "", "", "local", "local"))
            .doesNotThrowAnyException();
    }
}
