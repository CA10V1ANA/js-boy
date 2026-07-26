package com.ravtec.delivery.entity;

public enum PerfilAcesso {
    PROPRIETARIO,
    ENTREGADOR,
    CLIENTE,

    /**
     * Alias legado de ENTREGADOR. Novos acessos devem usar ENTREGADOR.
     */
    @Deprecated(forRemoval = false)
    FUNCIONARIO
}
