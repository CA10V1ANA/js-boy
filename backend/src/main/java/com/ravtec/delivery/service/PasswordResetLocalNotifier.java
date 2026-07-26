package com.ravtec.delivery.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.password-reset.provider", havingValue = "local", matchIfMissing = true)
public class PasswordResetLocalNotifier implements PasswordResetNotifier {
    @Override
    public void enviar(String email, String token) {
        log.info("security_event=password_reset_requested result=accepted destination=masked");
    }
}
