package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ravtec.delivery.entity.Auditoria;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.repository.AuditoriaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuditoriaServiceTest {
    @Mock private AuditoriaRepository repository;
    @Mock private IdentidadeAtual identidade;

    @Test
    void deveRegistrarResponsavelPerfilEAlteracoesSemCredenciais() {
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setNome("Proprietario");
        usuario.setPerfil(PerfilAcesso.PROPRIETARIO);
        when(identidade.usuario()).thenReturn(usuario);
        var service = new AuditoriaService(repository, identidade, new ObjectMapper());

        service.registrar("STATUS_ALTERADO", "ENTREGA", UUID.randomUUID(),
            Map.of("status", "COLETADA"), Map.of("status", "EM_ROTA"), null);

        var captor = ArgumentCaptor.forClass(Auditoria.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getUsuarioNome()).isEqualTo("Proprietario");
        assertThat(captor.getValue().getPerfil()).isEqualTo(PerfilAcesso.PROPRIETARIO);
        assertThat(captor.getValue().getValoresPosteriores()).contains("EM_ROTA").doesNotContain("senha");
    }
}
