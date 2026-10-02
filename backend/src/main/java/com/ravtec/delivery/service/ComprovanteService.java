package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ComprovanteResponse;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.repository.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.math.BigDecimal;
import java.security.*;
import java.time.OffsetDateTime;
import java.util.*;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.dao.DataIntegrityViolationException;

@Service
@Slf4j
@RequiredArgsConstructor
public class ComprovanteService {
    private final ComprovanteEntregaRepository repository;
    private final ParadaEntregaRepository paradaRepository;
    private final EntregaAcessoService acessoService;
    private final ArmazenamentoArquivo armazenamento;
    private final AuditoriaService auditoriaService;
    private final DesafioComprovanteService desafioService;
    @Value("${app.storage.max-file-bytes:5242880}")
    private long maxBytes;
    @Value("${app.proof.photo-required:false}")
    private boolean fotoObrigatoria;
    @Value("${app.proof.max-count-per-delivery:10}")
    private long maxComprovantesPorEntrega;
    @Value("${app.proof.max-bytes-per-delivery:26214400}")
    private long maxBytesPorEntrega;
    @Value("${app.proof.max-bytes-per-driver:1073741824}")
    private long maxBytesPorEntregador;
    @Value("${app.proof.max-total-bytes:10737418240}")
    private long maxBytesTotal;
    @Value("${app.proof.image.max-width:4096}")
    private int maxLargura;
    @Value("${app.proof.image.max-height:4096}")
    private int maxAltura;
    @Value("${app.proof.image.max-pixels:12000000}")
    private long maxPixels;
    @Value("${app.proof.image.max-expansion-ratio:250}")
    private long maxTaxaExpansao;

    public com.ravtec.delivery.dto.DesafioComprovanteResponse solicitarCodigo(UUID entregaId) {
        return desafioService.solicitar(entregaId);
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public ComprovanteResponse criar(
        UUID entregaId, UUID paradaId, TipoComprovante tipo, String chaveIdempotencia, MultipartFile arquivo,
        String recebedorNome, String assinatura, String otp, BigDecimal latitude,
        BigDecimal longitude, boolean consentimentoLocalizacao, String observacao
    ) {
        var entrega = acessoService.exigirDoEntregadorParaAtualizacao(entregaId);
        if (chaveIdempotencia == null || chaveIdempotencia.isBlank() || chaveIdempotencia.length() > 180) {
            throw new IllegalArgumentException("Idempotency-Key obrigatoria");
        }
        var existente = repository.findByEntregadorUsuarioIdAndChaveIdempotencia(
            entrega.getEntregador().getUsuario().getId(), chaveIdempotencia);
        if (existente.isPresent()) {
            var comp = existente.get();
            if (!comp.getEntrega().getId().equals(entregaId)
                || comp.getTipo() != tipo
                || !Objects.equals(comp.getParada() == null ? null : comp.getParada().getId(), paradaId)) {
                throw new ConflitoException("Idempotency-Key ja utilizada com dados diferentes", "IDEMPOTENCIA_CONFLITO_PAYLOAD");
            }
            return toResponse(comp);
        }
        var entregador = entrega.getEntregador();
        DesafioComprovanteService.Confirmacao confirmacao = null;
        var parada = paradaId == null ? null : paradaRepository.findByIdAndEntregaId(paradaId, entregaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Parada não encontrada"));
        if (tipo == TipoComprovante.ENTREGA) {
            confirmacao = desafioService.consumir(entrega, paradaId, otp);
            parada = confirmacao.parada();
        }
        if (fotoObrigatoria && (arquivo == null || arquivo.isEmpty())) {
            throw new IllegalArgumentException("A foto do comprovante e obrigatoria");
        }
        if (tipo == TipoComprovante.ENTREGA && (recebedorNome == null || recebedorNome.isBlank())) {
            throw new IllegalArgumentException("Informe quem recebeu a entrega");
        }
        if ((latitude != null || longitude != null) && !consentimentoLocalizacao) {
            throw new IllegalArgumentException("Localizacao exige consentimento");
        }
        var comprovante = new ComprovanteEntrega();
        comprovante.setEntrega(entrega); comprovante.setParada(parada); comprovante.setEntregador(entregador);
        comprovante.setTipo(tipo); comprovante.setChaveIdempotencia(chaveIdempotencia); comprovante.setRecebedorNome(limpar(recebedorNome));
        comprovante.setAssinatura(limpar(assinatura));
        if (confirmacao != null) {
            comprovante.setDesafio(confirmacao.desafio());
            comprovante.setVerificadoEm(OffsetDateTime.now());
        }
        comprovante.setLatitude(latitude); comprovante.setLongitude(longitude);
        comprovante.setLocalizacaoConsentida(consentimentoLocalizacao);
        comprovante.setObservacao(limpar(observacao));
        ArquivoValidado validado = arquivo == null || arquivo.isEmpty() ? null : validarEReprocessar(arquivo);
        validarQuotas(entrega, validado == null ? 0 : validado.bytes.length);
        String chaveNova = null;
        if (validado != null) {
            chaveNova = UUID.randomUUID() + validado.extensao;
            armazenamento.salvar(chaveNova, validado.bytes);
            registrarExclusaoEmRollback(chaveNova);
            comprovante.setStorageKey(chaveNova); comprovante.setMimeType(validado.mime);
            comprovante.setTamanhoBytes((long) validado.bytes.length); comprovante.setSha256(hash(validado.bytes));
        }
        try {
            repository.save(comprovante);
            auditoriaService.registrar("COMPROVANTE_CRIADO", "ENTREGA", entregaId, null,
                Map.of("comprovanteId", comprovante.getId(), "tipo", tipo.name()), null);
            return toResponse(comprovante);
        } catch (DataIntegrityViolationException exception) {
            if (chaveNova != null && !TransactionSynchronizationManager.isSynchronizationActive()) {
                excluirSeguro(chaveNova);
            }
            throw new ConflitoException("Idempotency-Key em uso (concorrencia)", "IDEMPOTENCIA_CONFLITO");
        } catch (RuntimeException exception) {
            if (chaveNova != null && !TransactionSynchronizationManager.isSynchronizationActive()) {
                excluirSeguro(chaveNova);
            }
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<ComprovanteResponse> listar(UUID entregaId) {
        acessoService.exigirLeitura(entregaId);
        return repository.findByEntregaIdAndSubstituidoPorIsNullOrderByCriadoEmDesc(entregaId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ResponseEntity<InputStreamResource> baixar(UUID entregaId, UUID comprovanteId) {
        acessoService.exigirLeitura(entregaId);
        var c = repository.findByIdAndEntregaId(comprovanteId, entregaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Comprovante não encontrado"));
        if (c.getStorageKey() == null) throw new RecursoNaoEncontradoException("Comprovante sem arquivo");
        var disposicao = "application/pdf".equalsIgnoreCase(c.getMimeType())
            ? "attachment; filename=\"comprovante.pdf\""
            : "inline; filename=\"comprovante\"";
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .contentType(MediaType.parseMediaType(c.getMimeType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, disposicao)
            .body(new InputStreamResource(armazenamento.abrir(c.getStorageKey())));
    }

    private ArquivoValidado validarEReprocessar(MultipartFile arquivo) {
        if (arquivo.getSize() <= 0 || arquivo.getSize() > maxBytes) {
            throw new IllegalArgumentException("Arquivo vazio ou acima do limite permitido");
        }
        try {
            byte[] bytes = arquivo.getBytes();
            if (bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D'
                && bytes[3] == 'F' && bytes[4] == '-') {
                throw new IllegalArgumentException("Envie uma foto JPEG ou PNG");
            }
            try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                if (input == null) throw new IllegalArgumentException("Conteúdo do arquivo inválido");
                Iterator<ImageReader> leitores = ImageIO.getImageReaders(input);
                if (!leitores.hasNext()) throw new IllegalArgumentException("Conteúdo do arquivo inválido");
                ImageReader leitor = leitores.next();
                try {
                    leitor.setInput(input, false, true);
                    String formato = leitor.getFormatName().toLowerCase(Locale.ROOT);
                    boolean png = formato.equals("png");
                    if (!png && !formato.equals("jpeg") && !formato.equals("jpg")) {
                        throw new IllegalArgumentException("Formato de imagem não suportado");
                    }
                    int quadros = leitor.getNumImages(true);
                    if (quadros != 1) throw new IllegalArgumentException("A imagem deve ter somente um quadro");
                    int largura = leitor.getWidth(0);
                    int altura = leitor.getHeight(0);
                    long pixels;
                    long bytesDecodificados;
                    try {
                        pixels = Math.multiplyExact((long) largura, (long) altura);
                        bytesDecodificados = Math.multiplyExact(pixels, 4L);
                    } catch (ArithmeticException exception) {
                        throw new IllegalArgumentException("Dimensoes da imagem acima do limite", exception);
                    }
                    if (largura <= 0 || altura <= 0 || largura > maxLargura || altura > maxAltura
                        || pixels > maxPixels || bytesDecodificados / Math.max(1, bytes.length) > maxTaxaExpansao) {
                        throw new IllegalArgumentException("Dimensoes ou taxa de expansao da imagem acima do limite");
                    }
                    BufferedImage image = leitor.read(0);
                    var output = new ByteArrayOutputStream();
                    if (!ImageIO.write(image, png ? "png" : "jpg", output)) {
                        throw new IllegalArgumentException("Formato de imagem não suportado");
                    }
                    if (output.size() > maxBytes) {
                        throw new IllegalArgumentException("Imagem processada acima do limite permitido");
                    }
                    return new ArquivoValidado(output.toByteArray(), png ? "image/png" : "image/jpeg",
                        png ? ".png" : ".jpg");
                } finally {
                    leitor.dispose();
                }
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Não foi possível ler o arquivo", e);
        }
    }

    private void validarQuotas(Entrega entrega, long novosBytes) {
        if (repository.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId()) >= maxComprovantesPorEntrega) {
            throw new IllegalStateException("Limite de comprovantes da entrega excedido");
        }
        if (repository.somarBytesDaEntrega(entrega.getId()) + novosBytes > maxBytesPorEntrega
            || repository.somarBytesDoEntregador(entrega.getEntregador().getId()) + novosBytes > maxBytesPorEntregador
            || repository.somarBytesTotal() + novosBytes > maxBytesTotal) {
            throw new IllegalStateException("Quota de armazenamento de comprovantes excedida");
        }
    }

    private void registrarExclusaoEmRollback(String chave) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == TransactionSynchronization.STATUS_ROLLED_BACK) {
                    excluirSeguro(chave);
                }
            }
        });
    }

    private void excluirSeguro(String chave) {
        try {
            armazenamento.excluir(chave);
        } catch (RuntimeException exception) {
            log.error("proof_storage_cleanup_failed storage_key={}", chave);
        }
    }

    private ComprovanteResponse toResponse(ComprovanteEntrega c) {
        return new ComprovanteResponse(c.getId(), c.getEntrega().getId(),
            c.getParada() == null ? null : c.getParada().getId(), c.getTipo(),
            c.getStorageKey() != null, c.getMimeType(), c.getRecebedorNome(),
            c.getAssinatura() != null || c.getVerificadoEm() != null,
            c.isLocalizacaoConsentida() && c.getLatitude() != null, c.getObservacao(), c.getCriadoEm());
    }

    private String hash(String value) { return hash(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
    private String hash(byte[] value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value)); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    private String limpar(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private record ArquivoValidado(byte[] bytes, String mime, String extensao) {}
}
