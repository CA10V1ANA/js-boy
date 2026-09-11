package com.ravtec.delivery.service;

import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.repository.FechamentoFinanceiroRepository;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ControleFechamentoFinanceiroService {
    private final FechamentoFinanceiroRepository fechamentos;
    private final CoordenacaoFinanceiraService coordenacao;

    @Value("${app.business-zone:America/Fortaleza}")
    private String zona;

    public void validarAberto(OffsetDateTime ocorridoEm) {
        coordenacao.bloquear();
        var data = ocorridoEm.atZoneSameInstant(ZoneId.of(zona)).toLocalDate();
        if (fechamentos.existsByInicioLessThanEqualAndFimGreaterThanEqualAndReabertoEmIsNull(data, data)) {
            throw new ConflitoException("Periodo financeiro fechado");
        }
    }
}
