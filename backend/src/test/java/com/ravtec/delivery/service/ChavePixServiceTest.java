package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import com.ravtec.delivery.entity.TipoChavePix;
import org.junit.jupiter.api.Test;

class ChavePixServiceTest {
    private final ChavePixService service = new ChavePixService();

    @Test void preservaEmailEChaveAleatoriaSemMascaraNumerica() {
        assertThat(service.normalizar(TipoChavePix.EMAIL, " Nome@Example.invalid ", "Titular"))
            .isEqualTo("nome@example.invalid");
        assertThat(service.normalizar(TipoChavePix.ALEATORIA, "AABBCCDD-1111-2222-3333-444444444444", "Titular"))
            .isEqualTo("aabbccdd-1111-2222-3333-444444444444");
    }
    @Test void normalizaCpfETelefone() {
        assertThat(service.normalizar(TipoChavePix.CPF, "529.982.247-25", "Titular")).isEqualTo("52998224725");
        assertThat(service.normalizar(TipoChavePix.TELEFONE, "(85) 99999-0001", "Titular")).isEqualTo("+5585999990001");
    }
    @Test void rejeitaChaveInvalidaOuCadastroParcial() {
        assertThatThrownBy(() -> service.normalizar(TipoChavePix.EMAIL, "invalido", "Titular"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.normalizar(TipoChavePix.ALEATORIA, "123", "Titular"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.normalizar(TipoChavePix.CPF, "11111111111", "Titular"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.normalizar(TipoChavePix.EMAIL, "nome@example.invalid", ""))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
