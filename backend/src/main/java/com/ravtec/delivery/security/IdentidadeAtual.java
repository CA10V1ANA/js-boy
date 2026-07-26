package com.ravtec.delivery.security;

import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.entity.Entregador;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.ClienteRepository;
import com.ravtec.delivery.repository.EntregadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class IdentidadeAtual {

    private final ClienteRepository clienteRepository;
    private final EntregadorRepository entregadorRepository;

    public UsuarioPrincipal principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
            || !authentication.isAuthenticated()
            || authentication instanceof AnonymousAuthenticationToken
            || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)) {
            throw new AccessDeniedException("Usuario autenticado nao identificado");
        }
        return principal;
    }

    public Usuario usuario() {
        return principal().getUsuario();
    }

    public Cliente clienteObrigatorio() {
        return clienteRepository.findByUsuarioIdAndAtivoTrue(principal().getId())
            .orElseThrow(() -> new AccessDeniedException("Usuario cliente sem vinculo ativo"));
    }

    public Entregador entregadorObrigatorio() {
        return entregadorRepository.findByUsuarioIdAndAtivoTrue(principal().getId())
            .orElseThrow(() -> new AccessDeniedException("Usuario entregador sem vinculo ativo"));
    }
}
