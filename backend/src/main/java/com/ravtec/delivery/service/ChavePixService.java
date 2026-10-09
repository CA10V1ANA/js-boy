package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.TipoChavePix;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ChavePixService {
    public String normalizar(TipoChavePix tipo, String chave, String titular) {
        if (tipo == null && (chave == null || chave.isBlank()) && (titular == null || titular.isBlank())) return null;
        if (tipo == null || chave == null || chave.isBlank() || titular == null || titular.isBlank())
            throw new IllegalArgumentException("Informe tipo, chave Pix e nome do titular");
        var valor = chave.trim();
        switch (tipo) {
            case CPF -> valor = new NormalizacaoService().cpf(valor);
            case TELEFONE -> {
                valor = valor.replaceAll("[\\s()\\-]", "");
                if (!valor.startsWith("+")) valor = "+55" + valor;
                if (!valor.matches("\\+[1-9]\\d{7,14}"))
                    throw new IllegalArgumentException("Chave de telefone deve usar formato internacional, como +5511999999999");
            }
            case EMAIL -> {
                valor = valor.toLowerCase(Locale.ROOT);
                if (!valor.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))
                    throw new IllegalArgumentException("Chave Pix de e-mail inválida");
            }
            case ALEATORIA -> {
                if (!valor.matches("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
                    throw new IllegalArgumentException("Chave Pix aleatória deve ser um UUID");
                valor = UUID.fromString(valor).toString();
            }
        }
        return valor;
    }
}
