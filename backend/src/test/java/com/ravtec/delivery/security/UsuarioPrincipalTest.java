package com.ravtec.delivery.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UsuarioPrincipalTest {
    @Test
    void negaContaQuandoVinculoDeClienteEstaInativo() {
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setAtivo(true);
        usuario.setPerfil(PerfilAcesso.CLIENTE);
        var cliente = new Cliente();
        cliente.setAtivo(false);
        cliente.setUsuario(usuario);
        usuario.setCliente(cliente);

        assertThat(new UsuarioPrincipal(usuario).isEnabled()).isFalse();
    }

    @Test
    void preservaAcessoDoProprietarioAtivo() {
        var usuario = new Usuario();
        usuario.setAtivo(true);
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        assertThat(new UsuarioPrincipal(usuario).isEnabled()).isTrue();
    }
}
