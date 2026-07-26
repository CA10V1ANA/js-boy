package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.EntregaOperacionalResponse;
import com.ravtec.delivery.dto.EntregaStatusRequest;
import com.ravtec.delivery.entity.AcaoOffline;
import com.ravtec.delivery.repository.AcaoOfflineRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SincronizacaoOfflineService {
    private final AcaoOfflineRepository repository;
    private final EntregaService entregaService;
    private final IdentidadeAtual identidadeAtual;
    private final EntregaAcessoService acessoService;

    @Transactional
    public EntregaOperacionalResponse alterarStatus(
        UUID entregaId, EntregaStatusRequest request, String chave
    ) {
        if (chave == null || chave.isBlank() || chave.length() > 180) {
            throw new IllegalArgumentException("Idempotency-Key obrigatoria");
        }
        var usuario = identidadeAtual.usuario();
        var existente = repository.findByUsuarioIdAndChaveIdempotencia(usuario.getId(), chave);
        if (existente.isPresent()) {
            return entregaService.consultarMinhaEntrega(existente.get().getEntrega().getId());
        }
        var resposta = entregaService.alterarStatusMinhaEntrega(entregaId, request);
        var acao = new AcaoOffline();
        acao.setUsuario(usuario);
        acao.setEntrega(acessoService.exigirDoEntregador(entregaId));
        acao.setChaveIdempotencia(chave);
        acao.setAcao("ALTERAR_STATUS");
        acao.setResultadoStatus(resposta.status().name());
        repository.save(acao);
        return resposta;
    }
}
