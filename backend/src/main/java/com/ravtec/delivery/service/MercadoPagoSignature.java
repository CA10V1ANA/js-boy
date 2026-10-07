package com.ravtec.delivery.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class MercadoPagoSignature {
    private final String secret;
    public MercadoPagoSignature(@Value("${app.mercadopago.webhook-secret:}") String secret) { this.secret = secret; }
    public void validar(String signature, String requestId, String dataId) {
        try {
            if (secret.isBlank() || signature == null || requestId == null || dataId == null
                || !dataId.matches("[0-9]{1,19}")) throw new IllegalArgumentException();
            String ts = null, v1 = null;
            for (String part : signature.split(",")) {
                String[] pair = part.trim().split("=", 2);
                if (pair.length != 2) throw new IllegalArgumentException();
                if (pair[0].equals("ts")) { if (ts != null) throw new IllegalArgumentException(); ts = pair[1]; }
                if (pair[0].equals("v1")) { if (v1 != null) throw new IllegalArgumentException(); v1 = pair[1]; }
            }
            if (ts == null || !ts.matches("[0-9]+") || v1 == null) throw new IllegalArgumentException();
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            var manifest = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
            if (!MessageDigest.isEqual(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)),
                HexFormat.of().parseHex(v1))) throw new IllegalArgumentException();
        } catch (Exception e) { throw new AccessDeniedException("Assinatura do webhook inválida"); }
    }
}
