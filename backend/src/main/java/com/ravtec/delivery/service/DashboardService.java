package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.DashboardResumoResponse;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.repository.ClienteRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.repository.EntregadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EntregaRepository entregaRepository;
    private final ClienteRepository clienteRepository;
    private final EntregadorRepository entregadorRepository;

    @Transactional(readOnly = true)
    public DashboardResumoResponse resumo() {
        var solicitadas = entregaRepository.countByStatus(StatusEntrega.SOLICITADA);
        var entregues = entregaRepository.countByStatus(StatusEntrega.ENTREGUE);
        var canceladas = entregaRepository.countByStatus(StatusEntrega.CANCELADA);
        var emAndamento = entregaRepository.count()
            - solicitadas
            - entregues
            - canceladas;

        return new DashboardResumoResponse(
            entregaRepository.count(),
            solicitadas,
            emAndamento,
            entregues,
            canceladas,
            entregaRepository.somarValorTotal(),
            clienteRepository.countByAtivoTrue(),
            entregadorRepository.countByAtivoTrue()
        );
    }
}
