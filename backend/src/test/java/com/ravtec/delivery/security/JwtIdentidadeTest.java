package com.ravtec.delivery.security;

import static org.assertj.core.api.Assertions.assertThat;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.entity.PerfilAcesso;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtIdentidadeTest {
    @Test
    void tokenNaoPodeSerReutilizadoPorOutraContaComOMesmoEmail() {
        var jwt = new JwtService("segredo-apenas-para-teste-com-mais-de-32-bytes", 15);
        var original = new Usuario(); original.setId(UUID.randomUUID()); original.setNome("Original");
        original.setEmail("antigo@example.invalid"); original.setPerfil(PerfilAcesso.CLIENTE);
        var token = jwt.gerarToken(new UsuarioPrincipal(original));
        assertThat(jwt.tokenValido(token, new UsuarioPrincipal(original))).isTrue();
        var outro = new Usuario(); outro.setId(UUID.randomUUID()); outro.setEmail(original.getEmail()); outro.setPerfil(PerfilAcesso.CLIENTE);
        assertThat(jwt.tokenValido(token, new UsuarioPrincipal(outro))).isFalse();
    }
}
