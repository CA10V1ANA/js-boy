package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.ravtec.delivery.entity.StatusEntrega;
import org.junit.jupiter.api.Test;

class EntregaStatusPolicyTest {

    private final EntregaStatusPolicy policy = new EntregaStatusPolicy();

    @Test
    void devePermitirFluxoOperacionalCompleto() {
        assertThatNoException().isThrownBy(() -> {
            policy.validarTransicao(StatusEntrega.SOLICITADA, StatusEntrega.CONFIRMADA);
            policy.validarTransicao(StatusEntrega.CONFIRMADA, StatusEntrega.AGUARDANDO_ENTREGADOR);
            policy.validarTransicao(
                StatusEntrega.AGUARDANDO_ENTREGADOR,
                StatusEntrega.ENTREGADOR_DESIGNADO
            );
            policy.validarTransicao(StatusEntrega.ENTREGADOR_DESIGNADO, StatusEntrega.COLETADA);
            policy.validarTransicao(StatusEntrega.COLETADA, StatusEntrega.EM_ROTA);
            policy.validarTransicao(StatusEntrega.EM_ROTA, StatusEntrega.ENTREGUE);
        });
    }

    @Test
    void deveBloquearRegressaoEEstadosTerminais() {
        assertThatThrownBy(() ->
            policy.validarTransicao(StatusEntrega.EM_ROTA, StatusEntrega.COLETADA)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            policy.validarTransicao(StatusEntrega.ENTREGUE, StatusEntrega.EM_ROTA)
        ).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() ->
            policy.validarTransicao(StatusEntrega.CANCELADA, StatusEntrega.SOLICITADA)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void deveBloquearCancelamentoDepoisDaColeta() {
        assertThatThrownBy(() ->
            policy.validarTransicao(StatusEntrega.COLETADA, StatusEntrega.CANCELADA)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void entregadorDeveExecutarSomenteProgressoesOperacionais() {
        assertThatNoException().isThrownBy(() ->
            policy.validarTransicaoDoEntregador(
                StatusEntrega.ENTREGADOR_DESIGNADO,
                StatusEntrega.COLETADA
            )
        );
        assertThatNoException().isThrownBy(() ->
            policy.validarTransicaoDoEntregador(StatusEntrega.COLETADA, StatusEntrega.EM_ROTA)
        );
        assertThatNoException().isThrownBy(() ->
            policy.validarTransicaoDoEntregador(StatusEntrega.EM_ROTA, StatusEntrega.ENTREGUE)
        );

        assertThatThrownBy(() ->
            policy.validarTransicaoDoEntregador(
                StatusEntrega.ENTREGADOR_DESIGNADO,
                StatusEntrega.CANCELADA
            )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void deveBloquearEdicaoEdesignacaoAPartirDaColeta() {
        assertThatNoException().isThrownBy(() ->
            policy.validarEdicaoAntesDaColeta(StatusEntrega.ENTREGADOR_DESIGNADO)
        );
        assertThatThrownBy(() ->
            policy.validarEdicaoAntesDaColeta(StatusEntrega.COLETADA)
        ).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() ->
            policy.validarEdicaoAntesDaColeta(StatusEntrega.ENTREGUE)
        ).isInstanceOf(IllegalStateException.class);
    }
}
