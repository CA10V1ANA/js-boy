package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.repository.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import javax.imageio.ImageIO;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.dao.DataIntegrityViolationException;

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
            .hasMessageContaining("inválido");
        verify(storage, never()).salvar(any(), any());
    }

    @Test
    void rejeitaNovoPdfMesmoComAssinaturaValida() {
        var arquivo = new MockMultipartFile("arquivo", "arquivo.bin", "application/octet-stream",
            "%PDF-1.4\nconteudo".getBytes());
        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-pdf", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("JPEG ou PNG");
        verify(storage, never()).salvar(any(), any());
    }

    @Test
    void aceitaFotoJpegEPngReprocessadas() throws Exception {
        for (var formato : new String[] {"jpeg", "png"}) {
            var imagem = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
            var bytes = new ByteArrayOutputStream();
            ImageIO.write(imagem, formato, bytes);
            var arquivo = new MockMultipartFile("arquivo", "foto.bin", "application/octet-stream", bytes.toByteArray());

            var response = service.criar(entrega.getId(), null, TipoComprovante.COLETA,
                "proof-" + formato, arquivo, null, null, null, null, null, false, null);

            assertThat(response.possuiArquivo()).isTrue();
            assertThat(response.mimeType()).isEqualTo("image/" + formato);
        }
        verify(storage, times(2)).salvar(any(), any());
    }

    @Test
    void pdfJaExistenteEEntregueComoAnexo() {
        var comprovante = new ComprovanteEntrega();
        comprovante.setStorageKey("legacy.pdf");
        comprovante.setMimeType("application/pdf");
        var id = UUID.randomUUID();
        when(repository.findByIdAndEntregaId(id, entrega.getId())).thenReturn(Optional.of(comprovante));
        when(storage.abrir("legacy.pdf")).thenReturn(new ByteArrayInputStream("%PDF-1.4".getBytes()));

        var response = service.baixar(entrega.getId(), id);

        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
            .isEqualTo("attachment; filename=\"comprovante.pdf\"");
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
    void removeArquivoQuandoPersistenciaFalhaForaDeTransacao() throws Exception {
        var arquivo = fotoPng();
        doThrow(new IllegalStateException("falha no banco")).when(repository).save(any());

        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-rollback", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(IllegalStateException.class);

        verify(storage).excluir(any());
    }

    @Test
    void lancaConflitoQuandoConstraintsDeBancoViolada() throws Exception {
        var arquivo = fotoPng();
        doThrow(new DataIntegrityViolationException("Constraint violation")).when(repository).save(any());

        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-concorrente", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(ConflitoException.class)
            .hasMessageContaining("concorrencia");

        verify(storage).excluir(any());
    }

    @Test
    void rejeitaQuotaDeQuantidadeAntesDeGravarArquivo() throws Exception {
        when(repository.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId())).thenReturn(10L);
        var arquivo = fotoPng();

        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "proof-quota", arquivo, null, null, null, null, null, false, null))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Limite de comprovantes");
        verify(storage, never()).salvar(any(), any());
    }

    @Test
    void rejeitaCriacaoSeChaveIdempotenciaReutilizadaComDadosDiferentes() {
        var comprovanteExistente = new ComprovanteEntrega();
        comprovanteExistente.setId(UUID.randomUUID());
        comprovanteExistente.setEntrega(entrega);
        comprovanteExistente.setTipo(TipoComprovante.COLETA);

        when(repository.findByEntregadorUsuarioIdAndChaveIdempotencia(
            entrega.getEntregador().getUsuario().getId(), "chave-reutilizada"))
            .thenReturn(Optional.of(comprovanteExistente));

        // Mesma chave, dados iguais -> sucesso (retorna o existente)
        var response = service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "chave-reutilizada", null, null, null, null, null, null, false, null);
        assertThat(response.id()).isEqualTo(comprovanteExistente.getId());

        // Mesma chave, tipo diferente -> conflito
        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.ENTREGA,
            "chave-reutilizada", null, "João", null, "123", null, null, false, null))
            .isInstanceOf(ConflitoException.class)
            .hasMessageContaining("dados diferentes");
    }

    @Test
    void naoConsultaArquivoQuandoLeituraDaEntregaEProibida() {
        var comprovanteId = UUID.randomUUID();
        doThrow(new AccessDeniedException("sem acesso"))
            .when(acesso).exigirLeitura(entrega.getId());

        assertThatThrownBy(() -> service.baixar(entrega.getId(), comprovanteId))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(storage);
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

    private static MockMultipartFile fotoPng() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("arquivo", "foto.png", "image/png", bytes.toByteArray());
    }

    @ParameterizedTest
    @ValueSource(strings = {"recebedor", "assinatura", "observacao", "latitude", "longitude", "consentimento", "foto"})
    void rejeitaPayloadDivergenteSemGravarOuConsumirOtp(String campo) {
        var comp = existente();
        switch (campo) {
            case "recebedor" -> comp.setRecebedorNome("Outra pessoa");
            case "assinatura" -> comp.setAssinatura("outra assinatura");
            case "observacao" -> comp.setObservacao("outra observacao");
            case "latitude" -> comp.setLatitude(new BigDecimal("-3.9"));
            case "longitude" -> comp.setLongitude(null);
            case "consentimento" -> comp.setLocalizacaoConsentida(false);
            case "foto" -> comp.setStorageKey("foto-existente.png");
        }
        assertThatThrownBy(() -> repetirCompleto(null))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("dados diferentes");
        verify(repository, never()).save(any());
        verifyNoInteractions(storage, desafio, auditoria);
    }

    @Test
    void retryComFotoIdenticaConservaRegistroERejeitaFotoDiferente() throws Exception {
        var foto = fotoPng();
        var primeiro = service.criar(entrega.getId(), null, TipoComprovante.COLETA,
            "retry", foto, "Maria", "assinatura", null, new BigDecimal("-3.7"),
            new BigDecimal("-38.5"), true, "observacao");
        var captura = org.mockito.ArgumentCaptor.forClass(ComprovanteEntrega.class);
        verify(repository).save(captura.capture());
        when(repository.findByEntregadorUsuarioIdAndChaveIdempotencia(any(), any()))
            .thenReturn(Optional.of(captura.getValue()));
        assertThat(repetirCompleto(foto).id()).isEqualTo(primeiro.id());
        var imagem = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        imagem.setRGB(0, 0, 0xFF0000);
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(imagem, "png", bytes);
        var outra = new MockMultipartFile("arquivo", "foto.png", "image/png", bytes.toByteArray());
        assertThatThrownBy(() -> repetirCompleto(outra)).isInstanceOf(ConflitoException.class);
        verify(repository, times(1)).save(any());
        verify(storage, times(1)).salvar(any(), any());
    }

    @Test
    void normalizaTextoEPrecisaoDoBancoNoRetrySemArquivo() {
        var comp = existente();
        var resposta = service.criar(entrega.getId(), null, TipoComprovante.COLETA, "retry", null,
            " Maria ", " assinatura ", null, new BigDecimal("-3.700000001"),
            new BigDecimal("-38.5000000"), true, " observacao ");
        assertThat(resposta.id()).isEqualTo(comp.getId());
        verify(repository, never()).save(any());
    }

    @Test
    void retryDeEntregaComParadaAutomaticaNaoConsomeCodigoNovamente() {
        var comp = existente();
        comp.setTipo(TipoComprovante.ENTREGA);
        var parada = new ParadaEntrega(); parada.setId(UUID.randomUUID());
        comp.setParada(parada);
        comp.setVerificadoEm(OffsetDateTime.now().minusDays(1));
        comp.setOtpHash(new TokenSeguroService().hash(entrega.getId() + ":123456"));
        var response = service.criar(entrega.getId(), null, TipoComprovante.ENTREGA, "retry", null,
            "Maria", "assinatura", "123456", new BigDecimal("-3.7"), new BigDecimal("-38.5"), true, "observacao");
        assertThat(response.id()).isEqualTo(comp.getId());
        assertThatThrownBy(() -> service.criar(entrega.getId(), null, TipoComprovante.ENTREGA, "retry", null,
            "Maria", "assinatura", "654321", new BigDecimal("-3.7"), new BigDecimal("-38.5"), true, "observacao"))
            .isInstanceOf(ConflitoException.class);
        verifyNoInteractions(desafio, storage);
        verify(repository, never()).save(any());
    }

    private ComprovanteEntrega existente() {
        var comp = new ComprovanteEntrega(); comp.setId(UUID.randomUUID());
        comp.setEntrega(entrega); comp.setTipo(TipoComprovante.COLETA);
        comp.setRecebedorNome("Maria"); comp.setAssinatura("assinatura"); comp.setObservacao("observacao");
        comp.setLatitude(new BigDecimal("-3.7")); comp.setLongitude(new BigDecimal("-38.5"));
        comp.setLocalizacaoConsentida(true);
        when(repository.findByEntregadorUsuarioIdAndChaveIdempotencia(any(), any()))
            .thenReturn(Optional.of(comp));
        return comp;
    }

    private com.ravtec.delivery.dto.ComprovanteResponse repetirCompleto(MockMultipartFile foto) {
        return service.criar(entrega.getId(), null, TipoComprovante.COLETA, "retry", foto,
            "Maria", "assinatura", null, new BigDecimal("-3.7"), new BigDecimal("-38.5"), true, "observacao");
    }

}
