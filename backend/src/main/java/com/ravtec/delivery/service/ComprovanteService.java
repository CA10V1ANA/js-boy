package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.ComprovanteResponse;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.math.BigDecimal;
import java.security.*;
import java.util.*;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ComprovanteService {
    private final ComprovanteEntregaRepository repository;
    private final ParadaEntregaRepository paradaRepository;
    private final EntregaAcessoService acessoService;
    private final ArmazenamentoArquivo armazenamento;
    private final AuditoriaService auditoriaService;
    @Value("${app.storage.max-file-bytes:5242880}")
    private long maxBytes;
    @Value("${app.proof.photo-required:false}")
    private boolean fotoObrigatoria;

    @Transactional
    public ComprovanteResponse criar(
        UUID entregaId, UUID paradaId, TipoComprovante tipo, String chaveIdempotencia, MultipartFile arquivo,
        String recebedorNome, String assinatura, String otp, BigDecimal latitude,
        BigDecimal longitude, boolean consentimentoLocalizacao, String observacao
    ) {
        var entrega = acessoService.exigirDoEntregador(entregaId);
        if (chaveIdempotencia == null || chaveIdempotencia.isBlank() || chaveIdempotencia.length() > 180) {
            throw new IllegalArgumentException("Idempotency-Key obrigatoria");
        }
        var existente = repository.findByEntregadorUsuarioIdAndChaveIdempotencia(
            entrega.getEntregador().getUsuario().getId(), chaveIdempotencia);
        if (existente.isPresent()) return toResponse(existente.get());
        var entregador = entrega.getEntregador();
        var parada = paradaId == null ? null : paradaRepository.findByIdAndEntregaId(paradaId, entregaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Parada nao encontrada"));
        if (fotoObrigatoria && (arquivo == null || arquivo.isEmpty())) {
            throw new IllegalArgumentException("A foto do comprovante e obrigatoria");
        }
        if (tipo == TipoComprovante.ENTREGA
            && (recebedorNome == null || recebedorNome.isBlank())
            && (assinatura == null || assinatura.isBlank())
            && (otp == null || otp.isBlank())) {
            throw new IllegalArgumentException("Informe recebedor, assinatura ou OTP");
        }
        if ((latitude != null || longitude != null) && !consentimentoLocalizacao) {
            throw new IllegalArgumentException("Localizacao exige consentimento");
        }
        var comprovante = new ComprovanteEntrega();
        comprovante.setEntrega(entrega); comprovante.setParada(parada); comprovante.setEntregador(entregador);
        comprovante.setTipo(tipo); comprovante.setChaveIdempotencia(chaveIdempotencia); comprovante.setRecebedorNome(limpar(recebedorNome));
        comprovante.setAssinatura(limpar(assinatura)); comprovante.setOtpHash(otp == null ? null : hash(otp));
        comprovante.setLatitude(latitude); comprovante.setLongitude(longitude);
        comprovante.setLocalizacaoConsentida(consentimentoLocalizacao);
        comprovante.setObservacao(limpar(observacao));
        if (arquivo != null && !arquivo.isEmpty()) {
            var validado = validarEReprocessar(arquivo);
            String chave = UUID.randomUUID() + validado.extensao;
            armazenamento.salvar(chave, validado.bytes);
            comprovante.setStorageKey(chave); comprovante.setMimeType(validado.mime);
            comprovante.setTamanhoBytes((long) validado.bytes.length); comprovante.setSha256(hash(validado.bytes));
        }
        repository.save(comprovante);
        auditoriaService.registrar("COMPROVANTE_CRIADO", "ENTREGA", entregaId, null,
            Map.of("comprovanteId", comprovante.getId(), "tipo", tipo.name()), null);
        return toResponse(comprovante);
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
            .orElseThrow(() -> new RecursoNaoEncontradoException("Comprovante nao encontrado"));
        if (c.getStorageKey() == null) throw new RecursoNaoEncontradoException("Comprovante sem arquivo");
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .contentType(MediaType.parseMediaType(c.getMimeType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"comprovante\"")
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
                return new ArquivoValidado(bytes, "application/pdf", ".pdf");
            }
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) throw new IllegalArgumentException("Conteudo do arquivo invalido");
            String mime = arquivo.getContentType();
            boolean png = "image/png".equalsIgnoreCase(mime);
            var output = new ByteArrayOutputStream();
            if (!ImageIO.write(image, png ? "png" : "jpg", output)) {
                throw new IllegalArgumentException("Formato de imagem nao suportado");
            }
            return new ArquivoValidado(output.toByteArray(), png ? "image/png" : "image/jpeg", png ? ".png" : ".jpg");
        } catch (IOException e) {
            throw new IllegalArgumentException("Nao foi possivel ler o arquivo", e);
        }
    }

    private ComprovanteResponse toResponse(ComprovanteEntrega c) {
        return new ComprovanteResponse(c.getId(), c.getEntrega().getId(),
            c.getParada() == null ? null : c.getParada().getId(), c.getTipo(),
            c.getStorageKey() != null, c.getMimeType(), c.getRecebedorNome(),
            c.getAssinatura() != null || c.getOtpHash() != null,
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
