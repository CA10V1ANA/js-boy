package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.LinkRastreamento;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.OffsetDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RastreamentoService {
    private final LinkRastreamentoRepository repository;
    private final EntregaAcessoService acessoService;
    private final ConfiguracaoEmpresaRepository empresaRepository;
    private final AuditoriaService auditoriaService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public LinkRastreamentoResponse criar(UUID entregaId, OffsetDateTime expiraEm) {
        var entrega = acessoService.buscar(entregaId);
        if (expiraEm != null && !expiraEm.isAfter(OffsetDateTime.now())) {
            throw new IllegalArgumentException("A expiracao deve estar no futuro");
        }
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var link = new LinkRastreamento();
        link.setEntrega(entrega);
        link.setCodigoPublico("JSB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        link.setTokenHash(hash(token));
        link.setExpiraEm(expiraEm);
        repository.save(link);
        auditoriaService.registrar("RASTREAMENTO_CRIADO", "ENTREGA", entregaId, null,
            Map.of("codigoPublico", link.getCodigoPublico(), "expiraEm", String.valueOf(expiraEm)), null);
        return new LinkRastreamentoResponse(link.getId(), link.getCodigoPublico(), token,
            link.getExpiraEm(), null, 0);
    }

    @Transactional
    public void revogar(UUID entregaId, UUID linkId) {
        acessoService.buscar(entregaId);
        var link = repository.findById(linkId)
            .filter(item -> item.getEntrega().getId().equals(entregaId))
            .orElseThrow(() -> new RecursoNaoEncontradoException("Link nao encontrado"));
        link.setRevogadoEm(OffsetDateTime.now());
        auditoriaService.registrar("RASTREAMENTO_REVOGADO", "ENTREGA", entregaId, null,
            Map.of("linkId", linkId), null);
    }

    @Transactional
    public RastreamentoPublicoResponse consultarPublico(String token) {
        var link = repository.findByTokenHash(hash(token))
            .orElseThrow(() -> new RecursoNaoEncontradoException("Rastreamento nao encontrado"));
        if (!link.ativoEm(OffsetDateTime.now())) {
            throw new RecursoNaoEncontradoException("Rastreamento expirado ou revogado");
        }
        link.setAcessos(link.getAcessos() + 1);
        link.setUltimoAcessoEm(OffsetDateTime.now());
        var entrega = link.getEntrega();
        var timeline = entrega.getHistorico().stream()
            .map(h -> new RastreamentoPublicoResponse.MarcoPublico(h.getNovoStatus(), h.getAlteradoEm())).toList();
        var empresa = empresaRepository.findAll().stream().findFirst().orElse(null);
        var contato = empresa == null
            ? new RastreamentoPublicoResponse.ContatoPublico("JS Boy", null, null, null, null)
            : new RastreamentoPublicoResponse.ContatoPublico(empresa.getNomeFantasia(), empresa.getTelefone(),
                empresa.getWhatsapp(), empresa.getEmail(), empresa.getHorarioAtendimento());
        return new RastreamentoPublicoResponse(link.getCodigoPublico(), entrega.getStatus(), timeline,
            entrega.getAgendadaFim(), entrega.getConcluidaEm(), contato);
    }

    private String hash(String token) {
        if (token == null || token.length() < 32 || token.length() > 100) {
            throw new RecursoNaoEncontradoException("Rastreamento nao encontrado");
        }
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponivel", e);
        }
    }
}
