package com.ravtec.delivery.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ravtec.delivery.dto.AuditoriaResponse;
import com.ravtec.delivery.entity.Auditoria;
import com.ravtec.delivery.repository.AuditoriaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditoriaService {
    private final AuditoriaRepository auditoriaRepository;
    private final IdentidadeAtual identidadeAtual;
    private final ObjectMapper objectMapper;

    @Transactional
    public void registrar(
        String acao,
        String entidade,
        UUID entidadeId,
        Object valoresAnteriores,
        Object valoresPosteriores,
        String motivo
    ) {
        var usuario = identidadeAtual.usuario();
        var auditoria = new Auditoria();
        auditoria.setUsuario(usuario);
        auditoria.setUsuarioNome(usuario.getNome());
        auditoria.setPerfil(usuario.getPerfilEfetivo());
        auditoria.setAcao(acao);
        auditoria.setEntidade(entidade);
        auditoria.setEntidadeId(entidadeId);
        auditoria.setValoresAnteriores(jsonSeguro(valoresAnteriores));
        auditoria.setValoresPosteriores(jsonSeguro(valoresPosteriores));
        auditoria.setMotivo(motivo == null || motivo.isBlank() ? null : motivo.trim());
        auditoria.setOcorridoEm(OffsetDateTime.now());
        auditoriaRepository.save(auditoria);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponse> listar(String entidade, UUID usuarioId) {
        var registros = usuarioId != null
            ? auditoriaRepository.findTop200ByUsuarioIdOrderByOcorridoEmDesc(usuarioId)
            : entidade != null && !entidade.isBlank()
                ? auditoriaRepository.findTop200ByEntidadeIgnoreCaseOrderByOcorridoEmDesc(entidade.trim())
                : auditoriaRepository.findTop200ByOrderByOcorridoEmDesc();
        return registros.stream().map(this::toResponse).toList();
    }

    private AuditoriaResponse toResponse(Auditoria item) {
        return new AuditoriaResponse(
            item.getId(),
            item.getUsuario().getId(),
            item.getUsuarioNome(),
            item.getPerfil(),
            item.getAcao(),
            item.getEntidade(),
            item.getEntidadeId(),
            item.getValoresAnteriores(),
            item.getValoresPosteriores(),
            item.getMotivo(),
            item.getOcorridoEm()
        );
    }

    private String jsonSeguro(Object valor) {
        if (valor == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(valor);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Nao foi possivel registrar a auditoria", exception);
        }
    }
}
