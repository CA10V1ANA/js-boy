package com.ravtec.delivery.dto;

import com.ravtec.delivery.entity.StatusParada;
import com.ravtec.delivery.entity.TipoParada;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ParadaResponse(
    UUID id, int ordem, TipoParada tipo, String endereco, String contatoNome,
    String contatoTelefone, String observacao, StatusParada status,
    OffsetDateTime previstaEm, OffsetDateTime realizadaEm, Long versao
) {}
