package com.ravtec.delivery.service;

import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class NormalizacaoService {
    public String digitos(String valor) {
        return valor == null || valor.isBlank() ? null : valor.replaceAll("[^0-9]", "");
    }

    public String email(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().toLowerCase(Locale.ROOT);
    }

    public String texto(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().replaceAll("\\s+", " ");
    }

    public String telefoneObrigatorio(String valor) {
        var normalizado = digitos(valor);
        if (normalizado == null || normalizado.length() < 10 || normalizado.length() > 15) {
            throw new IllegalArgumentException("Telefone deve conter entre 10 e 15 digitos");
        }
        return normalizado;
    }

    public String telefoneOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : telefoneObrigatorio(valor);
    }

    public String documento(String valor) {
        var normalizado = digitos(valor);
        if (normalizado == null) {
            return null;
        }
        if (!(cpfValido(normalizado) || cnpjValido(normalizado))) {
            throw new IllegalArgumentException("CPF ou CNPJ invalido");
        }
        return normalizado;
    }

    public String cpf(String valor) {
        var normalizado = digitos(valor);
        if (!cpfValido(normalizado)) {
            throw new IllegalArgumentException("CPF invalido");
        }
        return normalizado;
    }

    private boolean cpfValido(String valor) {
        if (valor == null || valor.length() != 11 || repetido(valor)) {
            return false;
        }
        return digitoCpf(valor, 9, 10) == valor.charAt(9) - '0'
            && digitoCpf(valor, 10, 11) == valor.charAt(10) - '0';
    }

    private int digitoCpf(String valor, int tamanho, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < tamanho; i++) {
            soma += (valor.charAt(i) - '0') * (pesoInicial - i);
        }
        int resto = 11 - (soma % 11);
        return resto >= 10 ? 0 : resto;
    }

    private boolean cnpjValido(String valor) {
        if (valor == null || valor.length() != 14 || repetido(valor)) {
            return false;
        }
        int[] p1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] p2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        return cnpjDigito(valor, 12, p1) == valor.charAt(12) - '0'
            && cnpjDigito(valor, 13, p2) == valor.charAt(13) - '0';
    }

    private int cnpjDigito(String valor, int tamanho, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < tamanho; i++) {
            soma += (valor.charAt(i) - '0') * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private boolean repetido(String valor) {
        return valor.chars().allMatch(item -> item == valor.charAt(0));
    }
}
