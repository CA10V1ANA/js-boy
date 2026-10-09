package com.ravtec.delivery.security;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;

class PoliticaSenhaTest {
    @Test void limiteConsideraBytesUtf8SemTruncarSenha() {
        assertThatCode(() -> PoliticaSenha.validarTamanho("á".repeat(36), 12)).doesNotThrowAnyException();
        assertThatThrownBy(() -> PoliticaSenha.validarTamanho("á".repeat(37), 12))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("72 bytes");
        assertThatThrownBy(() -> PoliticaSenha.validarTamanho("a".repeat(73), 1))
            .isInstanceOf(IllegalArgumentException.class);
    }
    @Test void novosAcessosExigemDozeCaracteresSemImpedirLoginLegado() {
        assertThatThrownBy(() -> PoliticaSenha.validarTamanho("Legado123", 12))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatCode(() -> PoliticaSenha.validarTamanho("Legado123", 1)).doesNotThrowAnyException();
    }
}
