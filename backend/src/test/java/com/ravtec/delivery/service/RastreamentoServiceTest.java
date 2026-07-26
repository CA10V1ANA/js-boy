package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;
import org.junit.jupiter.api.Test;

class RastreamentoServiceTest {
    private final LinkRastreamentoRepository links = mock(LinkRastreamentoRepository.class);
    private final EntregaAcessoService acesso = mock(EntregaAcessoService.class);
    private final ConfiguracaoEmpresaRepository empresa = mock(ConfiguracaoEmpresaRepository.class);
    private final AuditoriaService auditoria = mock(AuditoriaService.class);
    private final RastreamentoService service = new RastreamentoService(links, acesso, empresa, auditoria);

    @Test
    void tokenExpiradoNaoRetornaDados() throws Exception {
        String token = "token-publico-com-pelo-menos-32-caracteres";
        var link = link(token);
        link.setExpiraEm(OffsetDateTime.now().minusMinutes(1));
        when(links.findByTokenHash(hash(token))).thenReturn(Optional.of(link));
        assertThatThrownBy(() -> service.consultarPublico(token))
            .isInstanceOf(RecursoNaoEncontradoException.class)
            .hasMessageContaining("expirado");
    }

    @Test
    void respostaPublicaContemSomenteLinhaDoTempoEContatoPublico() throws Exception {
        String token = "token-publico-com-pelo-menos-32-caracteres";
        var link = link(token);
        var config = new ConfiguracaoEmpresa();
        config.setNomeFantasia("JS Boy"); config.setTelefone("85999999999");
        when(links.findByTokenHash(hash(token))).thenReturn(Optional.of(link));
        when(empresa.findAll()).thenReturn(List.of(config));

        var response = service.consultarPublico(token);

        assertThat(response.codigoPublico()).isEqualTo("JSB-PUBLICO");
        assertThat(response.status()).isEqualTo(StatusEntrega.EM_ROTA);
        assertThat(response.toString()).doesNotContain("85988887777", "documento", "valor");
        assertThat(link.getAcessos()).isEqualTo(1);
    }

    private LinkRastreamento link(String token) throws Exception {
        var entrega = new Entrega();
        entrega.setStatus(StatusEntrega.EM_ROTA);
        entrega.setDestinatarioTelefone("85988887777");
        entrega.setHistorico(new ArrayList<>());
        var link = new LinkRastreamento();
        link.setCodigoPublico("JSB-PUBLICO");
        link.setTokenHash(hash(token)); link.setEntrega(entrega);
        link.setExpiraEm(OffsetDateTime.now().plusHours(1));
        return link;
    }

    private String hash(String value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
            .digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
