package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;
import org.springframework.test.util.ReflectionTestUtils;

class ComprovanteServiceTest {
    private final ComprovanteEntregaRepository repository = mock(ComprovanteEntregaRepository.class);
    private final ParadaEntregaRepository paradas = mock(ParadaEntregaRepository.class);
    private final EntregaAcessoService acesso = mock(EntregaAcessoService.class);
    private final ArmazenamentoArquivo storage = mock(ArmazenamentoArquivo.class);
    private final AuditoriaService auditoria = mock(AuditoriaService.class);
    private final DesafioComprovanteService desafio = mock(DesafioComprovanteService.class);
    private final ComprovanteService service = new ComprovanteService(repository, paradas, acesso, storage, auditoria, desafio);
    private Entrega entrega;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(service, "maxBytes", 1024L * 1024);
        ReflectionTestUtils.setField(service, "fotoObrigatoria", false);
        ReflectionTestUtils.setField(service, "maxComprovantesPorEntrega", 10L);
        ReflectionTestUtils.setField(service, "maxBytesPorEntrega", 10L * 1024 * 1024);
        ReflectionTestUtils.setField(service, "maxBytesPorEntregador", 100L * 1024 * 1024);
        ReflectionTestUtils.setField(service, "maxBytesTotal", 1024L * 1024 * 1024);
        ReflectionTestUtils.setField(service, "maxLargura", 4096);
        ReflectionTestUtils.setField(service, "maxAltura", 4096);
        ReflectionTestUtils.setField(service, "maxPixels", 12_000_000L);
        ReflectionTestUtils.setField(service, "maxTaxaExpansao", 250L);
        var usuario = new Usuario(); usuario.setId(UUID.randomUUID());
        var entregador = new Entregador(); entregador.setId(UUID.randomUUID()); entregador.setUsuario(usuario);
        entrega = new Entrega(); entrega.setId(UUID.randomUUID()); entrega.setEntregador(entregador);
        when(acesso.exigirDoEntregadorParaAtualizacao(entrega.getId())).thenReturn(entrega);
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
        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-invalid", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("invalido");
        verify(storage, never()).salvar(any(), any());
    }

    @Test
    void aceitaPdfPeloConteudoENaoPeloNome() {
        var arquivo = new MockMultipartFile("arquivo", "arquivo.bin", "application/octet-stream",
            "%PDF-1.4\nconteudo".getBytes());
        var response = service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-pdf", arquivo, null, null, null, null, null, false, null);
        assertThat(response.possuiArquivo()).isTrue();
        assertThat(response.mimeType()).isEqualTo("application/pdf");
        verify(storage).salvar(endsWith(".pdf"), any());
    }

    @Test
    void rejeitaDimensoesExcessivasAntesDePersistir() throws Exception {
        var imagem = new BufferedImage(5000, 1, BufferedImage.TYPE_INT_RGB);
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(imagem, "png", bytes);
        var arquivo = new MockMultipartFile("arquivo", "larga.png", "image/png", bytes.toByteArray());

        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-wide", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Dimensoes");
        verify(storage, never()).salvar(any(), any());
    }

    @Test
    void removeArquivoQuandoPersistenciaFalhaForaDeTransacao() {
        var arquivo = new MockMultipartFile("arquivo", "arquivo.pdf", "application/pdf",
            "%PDF-1.4\nconteudo".getBytes());
        doThrow(new IllegalStateException("falha no banco")).when(repository).save(any());

        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-rollback", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(IllegalStateException.class);

        verify(storage).excluir(any());
    }

    @Test
    void rejeitaQuotaDeQuantidadeAntesDeGravarArquivo() {
        when(repository.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId())).thenReturn(10L);
        var arquivo = new MockMultipartFile("arquivo", "arquivo.pdf", "application/pdf",
            "%PDF-1.4\nconteudo".getBytes());

        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-quota", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Limite de comprovantes");
        verify(storage, never()).salvar(any(), any());
    }

    @Test
    void comprovanteDeEntregaFicaVinculadoAoDesafioVerificado() {
        entrega.setStatus(StatusEntrega.EM_ROTA);
        var parada = new ParadaEntrega(); parada.setId(UUID.randomUUID()); parada.setEntrega(entrega);
        var desafioEntity = new DesafioComprovanteEntrega(); desafioEntity.setId(UUID.randomUUID());
        when(desafio.consumir(entrega, null, "123456"))
            .thenReturn(new DesafioComprovanteService.Confirmacao(parada, desafioEntity));

        service.criar(entrega.getId(), null, TipoComprovante.ENTREGA,
            "proof-verified", null, "Maria", null, "123456", null, null, false, null);

        verify(repository).save(argThat(item -> item.getDesafio() == desafioEntity
            && item.getVerificadoEm() != null && item.getParada() == parada));
    }

}
