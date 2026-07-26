package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.ContatoPublicoRequest;
import com.ravtec.delivery.entity.SolicitacaoContato;
import com.ravtec.delivery.repository.SolicitacaoContatoRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SolicitacaoContatoServiceTest {

    @Mock
    private SolicitacaoContatoRepository repository;
    @Mock
    private ContatoRateLimitService rateLimitService;

    private SolicitacaoContatoService service;

    @BeforeEach
    void setUp() {
        service = new SolicitacaoContatoService(repository, rateLimitService);
    }

    @Test
    void deveNormalizarEPersistirSolicitacaoValida() {
        when(repository.save(any(SolicitacaoContato.class))).thenAnswer(invocation -> {
            var contato = invocation.getArgument(0, SolicitacaoContato.class);
            contato.setId(UUID.randomUUID());
            return contato;
        });

        var response = service.registrar(request(""), "127.0.0.1");

        assertThat(response.protocolo()).startsWith("JSB-C-");
        var captor = org.mockito.ArgumentCaptor.forClass(SolicitacaoContato.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("cliente@example.com");
        assertThat(captor.getValue().getTelefone()).isEqualTo("85999998888");
    }

    @Test
    void honeypotNaoDevePersistirDados() {
        var response = service.registrar(request("https://bot.invalid"), "127.0.0.2");

        assertThat(response.protocolo()).startsWith("JSB-C-");
        verify(repository, never()).save(any());
    }

    private ContatoPublicoRequest request(String website) {
        return new ContatoPublicoRequest(
            "Cliente",
            "Empresa",
            "CLIENTE@EXAMPLE.COM",
            "85999998888",
            "Preciso conversar sobre uma entrega.",
            website
        );
    }
}
