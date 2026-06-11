package com.ravtec.delivery.config;

import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        usuarioRepository.findByEmail("proprietario@jsboy.com")
            .orElseGet(this::criarProprietarioInicial);
    }

    private Usuario criarProprietarioInicial() {
        var usuario = new Usuario();
        usuario.setNome("Proprietario JS Boy");
        usuario.setEmail("proprietario@jsboy.com");
        usuario.setSenhaHash(passwordEncoder.encode("admin123"));
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        usuario.setAtivo(true);

        return usuarioRepository.save(usuario);
    }
}

