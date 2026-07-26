package com.ravtec.delivery.service;

import com.ravtec.delivery.entity.StatusEntrega;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class EntregaStatusPolicy {
    private static final Map<StatusEntrega, Set<StatusEntrega>> TRANSICOES = criarTransicoes();
    private static final Set<StatusEntrega> ESTADOS_ANTES_DA_COLETA = EnumSet.of(
        StatusEntrega.SOLICITADA, StatusEntrega.CONFIRMADA, StatusEntrega.AGENDADA,
        StatusEntrega.AGUARDANDO_ENTREGADOR, StatusEntrega.ENTREGADOR_DESIGNADO
    );
    private static final Set<StatusEntrega> DESTINOS_DO_ENTREGADOR = EnumSet.of(
        StatusEntrega.COLETADA, StatusEntrega.EM_ROTA, StatusEntrega.ENTREGUE,
        StatusEntrega.TENTATIVA_FALHOU, StatusEntrega.EM_DEVOLUCAO,
        StatusEntrega.DEVOLVIDA, StatusEntrega.FALHA_OPERACIONAL
    );

    public void validarTransicao(StatusEntrega atual, StatusEntrega destino) {
        if (atual == null || destino == null || !TRANSICOES.getOrDefault(atual, Set.of()).contains(destino)) {
            throw new IllegalStateException("Transicao de status nao permitida: " + atual + " -> " + destino);
        }
    }

    public void validarTransicaoDoEntregador(StatusEntrega atual, StatusEntrega destino) {
        validarTransicao(atual, destino);
        if (!DESTINOS_DO_ENTREGADOR.contains(destino)) {
            throw new IllegalStateException("Entregador nao pode realizar a transicao: " + atual + " -> " + destino);
        }
    }

    public void validarEdicaoAntesDaColeta(StatusEntrega status) {
        if (!ESTADOS_ANTES_DA_COLETA.contains(status)) {
            throw new IllegalStateException("Entrega nao pode ser editada ou redesignada apos a coleta");
        }
    }

    public boolean exigeEntregador(StatusEntrega status) {
        return EnumSet.of(
            StatusEntrega.ENTREGADOR_DESIGNADO, StatusEntrega.COLETADA, StatusEntrega.EM_ROTA,
            StatusEntrega.TENTATIVA_FALHOU, StatusEntrega.EM_DEVOLUCAO, StatusEntrega.ENTREGUE,
            StatusEntrega.DEVOLVIDA, StatusEntrega.FALHA_OPERACIONAL
        ).contains(status);
    }

    private static Map<StatusEntrega, Set<StatusEntrega>> criarTransicoes() {
        var t = new EnumMap<StatusEntrega, Set<StatusEntrega>>(StatusEntrega.class);
        t.put(StatusEntrega.SOLICITADA, EnumSet.of(StatusEntrega.CONFIRMADA, StatusEntrega.AGENDADA, StatusEntrega.CANCELADA));
        t.put(StatusEntrega.CONFIRMADA, EnumSet.of(StatusEntrega.AGENDADA, StatusEntrega.AGUARDANDO_ENTREGADOR, StatusEntrega.ENTREGADOR_DESIGNADO, StatusEntrega.CANCELADA));
        t.put(StatusEntrega.AGENDADA, EnumSet.of(StatusEntrega.AGUARDANDO_ENTREGADOR, StatusEntrega.ENTREGADOR_DESIGNADO, StatusEntrega.CANCELADA));
        t.put(StatusEntrega.AGUARDANDO_ENTREGADOR, EnumSet.of(StatusEntrega.ENTREGADOR_DESIGNADO, StatusEntrega.CANCELADA));
        t.put(StatusEntrega.ENTREGADOR_DESIGNADO, EnumSet.of(StatusEntrega.COLETADA, StatusEntrega.AGUARDANDO_ENTREGADOR, StatusEntrega.FALHA_OPERACIONAL, StatusEntrega.CANCELADA));
        t.put(StatusEntrega.COLETADA, EnumSet.of(StatusEntrega.EM_ROTA, StatusEntrega.FALHA_OPERACIONAL, StatusEntrega.EM_DEVOLUCAO));
        t.put(StatusEntrega.EM_ROTA, EnumSet.of(StatusEntrega.ENTREGUE, StatusEntrega.TENTATIVA_FALHOU, StatusEntrega.EM_DEVOLUCAO, StatusEntrega.FALHA_OPERACIONAL));
        t.put(StatusEntrega.TENTATIVA_FALHOU, EnumSet.of(StatusEntrega.EM_ROTA, StatusEntrega.EM_DEVOLUCAO, StatusEntrega.FALHA_OPERACIONAL));
        t.put(StatusEntrega.EM_DEVOLUCAO, EnumSet.of(StatusEntrega.DEVOLVIDA, StatusEntrega.FALHA_OPERACIONAL));
        t.put(StatusEntrega.ENTREGUE, EnumSet.noneOf(StatusEntrega.class));
        t.put(StatusEntrega.DEVOLVIDA, EnumSet.noneOf(StatusEntrega.class));
        t.put(StatusEntrega.FALHA_OPERACIONAL, EnumSet.noneOf(StatusEntrega.class));
        t.put(StatusEntrega.CANCELADA, EnumSet.noneOf(StatusEntrega.class));
        return Map.copyOf(t);
    }
}
