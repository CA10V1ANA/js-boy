package com.ravtec.delivery.config;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MercadoPagoConfiguration {
    @Bean
    PaymentClient mercadoPagoPaymentClient(@Value("${app.mercadopago.access-token:}") String token) {
        if (!token.isBlank()) MercadoPagoConfig.setAccessToken(token.trim());
        return new PaymentClient();
    }
}
