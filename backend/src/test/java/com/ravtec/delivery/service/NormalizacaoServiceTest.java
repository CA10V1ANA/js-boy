package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;

class NormalizacaoServiceTest {
    private final NormalizacaoService service = new NormalizacaoService();

    @Test
    void deveNormalizarTelefoneDocumentoEEmail() {
        assertThat(service.telefoneObrigatorio("(11) 99999-0000")).isEqualTo("11999990000");
        assertThat(service.documento("529.982.247-25")).isEqualTo("52998224725");
        assertThat(service.documento("11.222.333/0001-81")).isEqualTo("11222333000181");
        assertThat(service.email("  Pessoa@EXEMPLO.COM ")).isEqualTo("pessoa@exemplo.com");
    }

    @Test
    void deveRejeitarDocumentoEtelefoneInvalidos() {
        assertThatThrownBy(() -> service.documento("111.111.111-11"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.telefoneObrigatorio("123"))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
