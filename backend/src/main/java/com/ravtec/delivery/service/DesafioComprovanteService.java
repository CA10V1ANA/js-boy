package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.DesafioComprovanteResponse;
import com.ravtec.delivery.entity.DesafioComprovanteEntrega;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.ParadaEntrega;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.entity.StatusParada;
import com.ravtec.delivery.entity.TipoParada;
import com.ravtec.delivery.exception.LimiteRequisicoesException;
import com.ravtec.delivery.repository.DesafioComprovanteEntregaRepository;
import com.ravtec.delivery.repository.ParadaEntregaRepository;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DesafioComprovanteService {
    private final DesafioComprovanteEntregaRepository repository;
    private final ParadaEntregaRepository paradaRepository;
    private final EntregaAcessoService acessoService;
    private final TokenSeguroService tokens;
    private final NotificadorOtpComprovante notificador;
    private final SecureRandom random = new SecureRandom();

    @Value("${app.proof.otp.expiration-minutes:10}") private long minutosExpiracao;
    @Value("${app.proof.otp.resend-seconds:60}") private long segundosReenvio;
    @Value("${app.proof.otp.max-attempts:5}") private int maxTentativas;

    @Transactional
    public DesafioComprovanteResponse solicitar(UUID entregaId) {
        var entrega = acessoService.exigirDoEntregadorParaAtualizacao(entregaId);
        exigirEmRota(entrega);
        var parada = paradaFinal(entregaId);
        if (parada.getStatus() != StatusParada.PENDENTE) {
            throw new IllegalStateException("A parada final ja foi concluida");
        }
        var destino = parada.getContatoTelefone() == null || parada.getContatoTelefone().isBlank()
            ? entrega.getDestinatarioTelefone() : parada.getContatoTelefone();
        if (destino == null || destino.isBlank()) {
            throw new IllegalStateException("Destinatario sem telefone para confirmacao");
        }
        var agora = OffsetDateTime.now();
        var desafio = repository.findByEntregaIdParaAtualizacao(entregaId)
            .orElseGet(DesafioComprovanteEntrega::new);
        if (desafio.getId() != null && desafio.ativo(agora)
            && desafio.getUltimoEnvioEm().isAfter(agora.minusSeconds(segundosReenvio))) {
            throw new LimiteRequisicoesException("Aguarde antes de solicitar outro codigo");
        }
        var codigo = String.format("%06d", random.nextInt(1_000_000));
        desafio.setEntrega(entrega);
        desafio.setParada(parada);
        desafio.setCodigoHash(hash(entregaId, codigo));
        desafio.setDestinoMascarado(mascarar(destino));
        desafio.setExpiraEm(agora.plusMinutes(minutosExpiracao));
        desafio.setUltimoEnvioEm(agora);
        desafio.setConsumidoEm(null);
        desafio.setTentativas(0);
        repository.save(desafio);
        notificador.enviar(destino, codigo, entregaId);
        return resposta(desafio);
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public Confirmacao consumir(Entrega entrega, UUID paradaInformadaId, String codigo) {
        exigirEmRota(entrega);
        var parada = paradaFinal(entrega.getId());
        if (paradaInformadaId != null && !parada.getId().equals(paradaInformadaId)) {
            throw new IllegalArgumentException("O comprovante deve pertencer a parada final");
        }
        var agora = OffsetDateTime.now();
        var desafio = repository.findByEntregaIdParaAtualizacao(entrega.getId())
            .orElseThrow(() -> new BadCredentialsException("Codigo de confirmacao invalido ou expirado"));
        if (!desafio.ativo(agora) || !desafio.getParada().getId().equals(parada.getId())
            || desafio.getTentativas() >= maxTentativas) {
            throw new BadCredentialsException("Codigo de confirmacao invalido ou expirado");
        }
        desafio.setTentativas(desafio.getTentativas() + 1);
        boolean valido = codigo != null && MessageDigest.isEqual(
            desafio.getCodigoHash().getBytes(java.nio.charset.StandardCharsets.UTF_8),
            hash(entrega.getId(), codigo.trim()).getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
        if (!valido) {
            if (desafio.getTentativas() >= maxTentativas) {
                desafio.setConsumidoEm(agora);
            }
            throw new BadCredentialsException("Codigo de confirmacao invalido ou expirado");
        }
        desafio.setConsumidoEm(agora);
        parada.setStatus(StatusParada.CONCLUIDA);
        parada.setRealizadaEm(agora);
        return new Confirmacao(parada, desafio);
    }

    private void exigirEmRota(Entrega entrega) {
        if (entrega.getStatus() != StatusEntrega.EM_ROTA) {
            throw new IllegalStateException("Confirmacao de entrega permitida somente durante a rota");
        }
    }

    private ParadaEntrega paradaFinal(UUID entregaId) {
        return paradaRepository.findByEntregaIdOrderByOrdem(entregaId).stream()
            .filter(item -> item.getTipo() == TipoParada.ENTREGA)
            .max(Comparator.comparing(ParadaEntrega::getOrdem))
            .orElseThrow(() -> new IllegalStateException("Entrega sem parada final configurada"));
    }

    private String hash(UUID entregaId, String codigo) {
        return tokens.hash(entregaId + ":" + codigo);
    }

    private String mascarar(String destino) {
        var digitos = destino.replaceAll("\\D", "");
        return digitos.length() < 4 ? "***" : "***" + digitos.substring(digitos.length() - 4);
    }

    private DesafioComprovanteResponse resposta(DesafioComprovanteEntrega desafio) {
        return new DesafioComprovanteResponse(desafio.getDestinoMascarado(), desafio.getExpiraEm());
    }

    public record Confirmacao(ParadaEntrega parada, DesafioComprovanteEntrega desafio) {}
}
