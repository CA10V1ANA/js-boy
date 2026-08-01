package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class SolicitacaoEntregaClienteServiceTest {
    @Test
    void derivaClienteDoContextoEMarcaNegociacaoPendenteSemAceitarValorManual() {
        var identidade = mock(IdentidadeAtual.class);
        var entregaService = mock(EntregaService.class);
        var entregas = mock(EntregaRepository.class);
        var paradas = mock(ParadaEntregaService.class);
        var notificacoes = mock(NotificacaoOutboxService.class);
        var tabelaPrecos = mock(TabelaPrecoService.class);
        var service = new SolicitacaoEntregaClienteService(
            identidade, entregaService, entregas, paradas, notificacoes, tabelaPrecos);
        var simulacao = mock(SimulacaoTabelaPrecoResponse.class);
        when(simulacao.valorNegociadoObrigatorio()).thenReturn(true);
        when(tabelaPrecos.calcular(eq("Aldeota"), eq(TipoVeiculo.MOTO), eq(0), eq(false),
            isNull(), eq(BigDecimal.ONE))).thenReturn(simulacao);
        var cliente = new Cliente(); cliente.setId(UUID.randomUUID()); cliente.setAtivo(true);
        when(identidade.clienteObrigatorio()).thenReturn(cliente);
        var response = mock(EntregaResponse.class);
        var entregaId = UUID.randomUUID();
        when(response.id()).thenReturn(entregaId);
        when(response.historico()).thenReturn(List.of());
        when(entregaService.criar(any())).thenReturn(response);
        var entrega = new Entrega();
        entrega.setId(entregaId); entrega.setCodigo("JSB-TESTE"); entrega.setCliente(cliente);
        entrega.setEnderecoOrigem("Origem"); entrega.setBairroOrigem("Centro");
        entrega.setEnderecoDestino("Destino"); entrega.setBairroDestino("Aldeota");
        entrega.setDestinatarioNome("Maria"); entrega.setDescricaoMercadoria("Caixa");
        entrega.setValorFinal(BigDecimal.TEN); entrega.setCriadoEm(OffsetDateTime.now());
        when(entregas.findById(entregaId)).thenReturn(Optional.of(entrega));

        service.solicitar(new SolicitacaoEntregaClienteRequest(
            "Origem", "Centro", "Destino", "Aldeota", "Maria", "85999999999",
            "Caixa", null, BigDecimal.ONE, null, null, null, null));

        var captor = ArgumentCaptor.forClass(EntregaRequest.class);
        verify(entregaService).criar(captor.capture());
        assertThat(captor.getValue().clienteId()).isEqualTo(cliente.getId());
        assertThat(captor.getValue().entregadorId()).isNull();
        assertThat(captor.getValue().valorFinal()).isNull();
        assertThat(captor.getValue().valorNegociado()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
