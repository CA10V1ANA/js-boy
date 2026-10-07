package com.ravtec.delivery.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.ravtec.delivery.exception.GlobalExceptionHandler;
import com.ravtec.delivery.service.MercadoPagoSignature;
import com.ravtec.delivery.service.PixService;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class MercadoPagoWebhookControllerTest {
    @Test void assinaturaAusenteNaoProcessaPagamento() throws Exception {
        var pix = mock(PixService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new MercadoPagoWebhookController(
            new MercadoPagoSignature("test-secret"), pix)).setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(post("/api/webhooks/mercadopago?data.id=123").contentType(MediaType.APPLICATION_JSON)
            .content("{\"type\":\"payment\",\"data\":{\"id\":123},\"status\":\"approved\"}"))
            .andExpect(status().isForbidden());
        verifyNoInteractions(pix);
    }
    @Test void corpoDivergenteNaoProcessaPagamento() throws Exception {
        var pix = mock(PixService.class);
        var mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        var hash = HexFormat.of().formatHex(mac.doFinal("id:123;request-id:req;ts:1;".getBytes(StandardCharsets.UTF_8)));
        var mvc = MockMvcBuilders.standaloneSetup(new MercadoPagoWebhookController(
            new MercadoPagoSignature("test-secret"), pix)).setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(post("/api/webhooks/mercadopago?data.id=123")
            .header("x-signature", "ts=1,v1=" + hash).header("x-request-id", "req")
            .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"payment\",\"data\":{\"id\":124}}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(pix);
    }
}
