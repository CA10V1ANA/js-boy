package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.entity.TentativaLogin;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.TentativaLoginRepository;
import com.ravtec.delivery.repository.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TentativaLoginServiceTest {
    private final TentativaLoginRepository repository = mock(TentativaLoginRepository.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final TokenSeguroService tokens = mock(TokenSeguroService.class);
    private final LimiteRequisicoesPublicasService limitador = mock(LimiteRequisicoesPublicasService.class);
    private final TentativaLoginService service = new TentativaLoginService(repository, usuarios, tokens, limitador);

    @BeforeEach
    void preparar() {
        ReflectionTestUtils.setField(service, "limiteOrigem", 30);
        ReflectionTestUtils.setField(service, "limiteGlobal", 1000);
        ReflectionTestUtils.setField(service, "minutosJanela", 5L);
        ReflectionTestUtils.setField(service, "horasRetencao", 24L);
    }

    @Test
    void emailInexistenteNaoCriaEstadoPersistente() {
        when(usuarios.findByEmail("unknown@example.invalid")).thenReturn(Optional.empty());

        service.falha("unknown@example.invalid");

        verify(repository, never()).save(any());
    }

    @Test
    void falhaConhecidaRegistraContadorSemBloquearVitima() {
        when(usuarios.findByEmail("known@example.invalid")).thenReturn(Optional.of(new Usuario()));
        when(tokens.hash("known@example.invalid")).thenReturn("hash");
        when(repository.findComBloqueioByEmailHash("hash")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.falha("known@example.invalid");

        var captor = org.mockito.ArgumentCaptor.forClass(TentativaLogin.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getFalhas()).isEqualTo(1);
        assertThat(captor.getValue().getBloqueadoAte()).isNull();
    }
}
