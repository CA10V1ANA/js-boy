package com.ravtec.delivery.config;

import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String ownerEmail;
    private final String ownerPassword;

    public DataInitializer(
        UsuarioRepository usuarioRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.seed.owner-email}") String ownerEmail,
        @Value("${app.seed.owner-password}") String ownerPassword
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.ownerEmail = ownerEmail == null ? "" : ownerEmail.trim().toLowerCase(Locale.ROOT);
        this.ownerPassword = ownerPassword;
    }

    @Override
    public void run(String... args) {
        if (ownerEmail.isBlank() || ownerPassword == null || ownerPassword.length() < 8) {
            throw new IllegalStateException(
                "SEED_OWNER_EMAIL e SEED_OWNER_PASSWORD (minimo 8 caracteres) sao obrigatorios no profile local"
            );
        }
        usuarioRepository.findByEmail(ownerEmail)
            .orElseGet(this::criarProprietarioInicial);
    }

    private Usuario criarProprietarioInicial() {
        var usuario = new Usuario();
        usuario.setNome("Proprietario JS Boy");
        usuario.setEmail(ownerEmail);
        usuario.setSenhaHash(passwordEncoder.encode(ownerPassword));
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        usuario.setAtivo(true);

        return usuarioRepository.save(usuario);
    }
}
