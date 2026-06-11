package com.ravtec.delivery.mapper;

import com.ravtec.delivery.dto.PagamentoResponse;
import com.ravtec.delivery.entity.Pagamento;
import org.springframework.stereotype.Component;

@Component
public class PagamentoMapper {

    public PagamentoResponse toResponse(Pagamento pagamento) {
        return new PagamentoResponse(
            pagamento.getId(),
            pagamento.getEntrega().getId(),
            pagamento.getEntrega().getCodigo(),
            pagamento.getEntrega().getCliente().getNome(),
            pagamento.getValor(),
            pagamento.getFormaPagamento(),
            pagamento.getPagoEm(),
            pagamento.getComprovante(),
            pagamento.getObservacoes(),
            pagamento.getCriadoEm()
        );
    }
}
