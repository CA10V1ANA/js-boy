package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.*;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

class ComprovanteServiceTest {
    private final ComprovanteEntregaRepository repository = mock(ComprovanteEntregaRepository.class);
    private final ParadaEntregaRepository paradas = mock(ParadaEntregaRepository.class);
    private final EntregaAcessoService acesso = mock(EntregaAcessoService.class);
    private final ArmazenamentoArquivo storage = mock(ArmazenamentoArquivo.class);
    private final AuditoriaService auditoria = mock(AuditoriaService.class);
    private final ComprovanteService service = new ComprovanteService(repository, paradas, acesso, storage, auditoria);
    private Entrega entrega;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(service, "maxBytes", 1024L * 1024);
        ReflectionTestUtils.setField(service, "fotoObrigatoria", false);
        var usuario = new Usuario(); usuario.setId(UUID.randomUUID());
        var entregador = new Entregador(); entregador.setId(UUID.randomUUID()); entregador.setUsuario(usuario);
        entrega = new Entrega(); entrega.setId(UUID.randomUUID()); entrega.setEntregador(entregador);
        when(acesso.exigirDoEntregador(entrega.getId())).thenReturn(entrega);
        when(repository.findByEntregadorUsuarioIdAndChaveIdempotencia(any(), any())).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> {
            var item = invocation.getArgument(0, ComprovanteEntrega.class);
            item.setId(UUID.randomUUID());
            return item;
        });
    }

    @Test
    void rejeitaArquivoDisfarcadoPelaExtensao() {
        var arquivo = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", "nao-e-imagem".getBytes());
        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.ENTREGA,
            "proof-invalid", arquivo, "Maria", null, null, null, null, false, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("invalido");
        verify(storage, never()).salvar(any(), any());
    }

    @Test
    void aceitaPdfPeloConteudoENaoPeloNome() {
        var arquivo = new MockMultipartFile("arquivo", "arquivo.bin", "application/octet-stream",
            "%PDF-1.4\nconteudo".getBytes());
        var response = service.criar(entrega.getId(), null, TipoComprovante.ENTREGA,
            "proof-pdf", arquivo, "Maria", null, null, null, null, false, null);
        assertThat(response.possuiArquivo()).isTrue();
        assertThat(response.mimeType()).isEqualTo("application/pdf");
        verify(storage).salvar(endsWith(".pdf"), any());
    }

}
