package com.ravtec.delivery.service;

public interface PasswordResetNotifier {
    void enviar(String email, String token);
}
