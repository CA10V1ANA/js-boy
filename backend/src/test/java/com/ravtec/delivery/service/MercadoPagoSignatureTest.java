package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

class MercadoPagoSignatureTest {
    @Test void aceitaAssinaturaERejeitaIdAlterado() throws Exception {
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        var hash = HexFormat.of().formatHex(mac.doFinal("id:123;request-id:req;ts:1704908010;".getBytes(StandardCharsets.UTF_8)));
        var validator = new MercadoPagoSignature("test-secret");
        validator.validar("ts=1704908010,v1=" + hash, "req", "123");
        assertThatThrownBy(() -> validator.validar("ts=1704908010,v1=" + hash, "req", "124"))
            .isInstanceOf(AccessDeniedException.class);
    }
    @Test void semSegredoOuHeadersRejeita() {
        assertThatThrownBy(() -> new MercadoPagoSignature("").validar(null, null, null))
            .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> new MercadoPagoSignature("secret").validar("ts=1,v1=oops", "r", "123"))
            .isInstanceOf(AccessDeniedException.class);
    }
}
