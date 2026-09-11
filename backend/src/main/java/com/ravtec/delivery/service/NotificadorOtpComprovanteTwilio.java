package com.ravtec.delivery.service;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(name = "app.proof.otp.provider", havingValue = "twilio")
public class NotificadorOtpComprovanteTwilio implements NotificadorOtpComprovante {
    private final RestClient client;
    private final String from;
    private final boolean whatsapp; private final String contentSid;

    public NotificadorOtpComprovanteTwilio(RestClient.Builder builder,
        @Value("${app.twilio.account-sid}") String accountSid,
        @Value("${app.twilio.auth-token}") String authToken,
        @Value("${app.twilio.from}") String from,
        @Value("${app.twilio.whatsapp:true}") boolean whatsapp,
        @Value("${app.twilio.content-sid:}") String contentSid) {
        this.client = builder.baseUrl("https://api.twilio.com/2010-04-01/Accounts/" + accountSid)
            .defaultHeaders(headers -> headers.setBasicAuth(accountSid, authToken)).build();
        this.from = from; this.whatsapp = whatsapp; this.contentSid = contentSid;
    }

    @Override public void enviar(String destino, String codigo, UUID entregaId) {
        var body = new LinkedMultiValueMap<String, String>();
        String prefix = whatsapp ? "whatsapp:" : "";
        body.add("From", prefix + from); body.add("To", prefix + normalizar(destino));
        if (whatsapp && !contentSid.isBlank()) {
            body.add("ContentSid", contentSid); body.add("ContentVariables", "{\"1\":\"" + codigo + "\"}");
        } else body.add("Body", "JS Boy: seu código de confirmação da entrega é " + codigo + ". Não compartilhe este código.");
        client.post().uri("/Messages.json").contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(body).retrieve().toBodilessEntity();
    }
    private String normalizar(String valor) {
        String digits = valor.replaceAll("\\D", "");
        if (digits.length() == 10 || digits.length() == 11) digits = "55" + digits;
        if (digits.length() < 12 || digits.length() > 15) throw new IllegalArgumentException("Telefone inválido para envio");
        return "+" + digits;
    }
}
