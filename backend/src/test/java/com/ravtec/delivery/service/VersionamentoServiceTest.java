package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.ravtec.delivery.exception.ConflitoException;
import org.junit.jupiter.api.Test;

class VersionamentoServiceTest {
    private final VersionamentoService service = new VersionamentoService();

    @Test
    void deveAceitarMesmaVersao() {
        assertThatCode(() -> service.validar(3L, 3L)).doesNotThrowAnyException();
    }

    @Test
    void deveRetornarConflitoQuandoRegistroMudou() {
        assertThatThrownBy(() -> service.validar(2L, 3L))
            .isInstanceOf(ConflitoException.class)
            .hasMessageContaining("Recarregue");
    }
}
