package com.ravtec.delivery.security;

import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        var email = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        return usuarioRepository.findByEmail(email)
            .map(UsuarioPrincipal::new)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado"));
    }
}
