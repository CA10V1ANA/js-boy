package com.ravtec.delivery.security;

import java.nio.charset.StandardCharsets;

public final class PoliticaSenha {
    private PoliticaSenha() {}

    public static void validarTamanho(String senha, int minimo) {
        if (senha == null || senha.length() < minimo)
            throw new IllegalArgumentException("A senha deve ter pelo menos " + minimo + " caracteres");
        if (senha.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("A senha excede o limite de 72 bytes; caracteres acentuados podem ocupar mais de um byte");
    }
}
