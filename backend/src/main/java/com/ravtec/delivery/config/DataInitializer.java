package com.ravtec.delivery.config;

import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile({"local", "staging"})
@ConditionalOnProperty(name = "app.bootstrap.owner.enabled", havingValue = "true")
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
        if (ownerEmail.isBlank() || ownerPassword == null || ownerPassword.length() < 12) {
            throw new IllegalStateException(
                "SEED_OWNER_EMAIL e SEED_OWNER_PASSWORD (minimo 12 caracteres) sao obrigatorios quando o bootstrap esta habilitado"
            );
        }
        var existente = usuarioRepository.findByEmail(ownerEmail);
        if (existente.isPresent()) {
            if (existente.get().getPerfilEfetivo() != PerfilAcesso.PROPRIETARIO) {
                throw new IllegalStateException("O email de bootstrap ja pertence a um usuario sem perfil de proprietario");
            }
            log.info("security_event=owner_bootstrap result=already_exists");
            return;
        }

        if (usuarioRepository.count() > 0) {
            throw new IllegalStateException(
                "Bootstrap recusado: o banco ja possui usuarios e o proprietario informado nao existe"
            );
        }

        criarProprietarioInicial();
        log.warn("security_event=owner_bootstrap result=created action=disable_bootstrap_and_rotate_password");
    }

    private void criarProprietarioInicial() {
        var usuario = new Usuario();
        usuario.setNome("Proprietario JS Boy");
        usuario.setEmail(ownerEmail);
        usuario.setSenhaHash(passwordEncoder.encode(ownerPassword));
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        usuario.setAtivo(true);

        usuarioRepository.save(usuario);
    }
}
