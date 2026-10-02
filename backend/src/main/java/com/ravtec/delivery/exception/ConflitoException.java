package com.ravtec.delivery.exception;

public class ConflitoException extends RuntimeException {
    private final String codigo;

    public ConflitoException(String message) {
        this(message, "BUSINESS_CONFLICT");
    }

    public ConflitoException(String message, String codigo) {
        super(message);
        this.codigo = codigo;
    }

    public String getCodigo() {
        return codigo;
    }
}
