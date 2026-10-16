package com.ravtec.delivery.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.ClienteRequest;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.*;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
class PerfilContaIT extends AbstractIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UsuarioRepository usuarios;
    @Autowired EntregadorRepository entregadores;
    @Autowired ClienteRepository clientes;
    @Autowired ClienteMapper clienteMapper;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;

    @Test
    void entregadorEditaSomenteSeuCadastroESincronizaIdentidade() throws Exception {
        var usuario = usuario(PerfilAcesso.ENTREGADOR);
        var proprio = entregador(usuario);
        var outro = entregador(usuario(PerfilAcesso.ENTREGADOR));
        var tokenAnterior = token(usuario);
        var novoEmail = "perfil-" + UUID.randomUUID() + "@example.invalid";
        mvc.perform(patch("/operacao-entregador/perfil").header("Authorization", tokenAnterior)
            .header("If-Match", proprio.getVersion()).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("id", outro.getId(), "nome", "Nome Atualizado", "email", novoEmail,
                "telefone", "85999998888", "placaVeiculo", "ABC-1D23", "tipoChavePix", "EMAIL",
                "chavePix", "pix@example.invalid", "titularPix", "Titular Novo"))))
            .andExpect(status().isOk()).andExpect(jsonPath("id").value(proprio.getId().toString()))
            .andExpect(jsonPath("placaVeiculo").value("ABC1D23")).andExpect(jsonPath("chavePix").value("pix@example.invalid"));
        var atualizado = usuarios.findById(usuario.getId()).orElseThrow();
        assertThat(atualizado.getNome()).isEqualTo("Nome Atualizado");
        assertThat(atualizado.getEmail()).isEqualTo(novoEmail);
        assertThat(entregadores.findById(outro.getId()).orElseThrow().getNome()).isEqualTo("Entregador Teste");
        mvc.perform(get("/auth/me").header("Authorization", tokenAnterior)).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("email", novoEmail, "senha", "TesteSeguro123"))))
            .andExpect(status().isOk()).andExpect(jsonPath("usuario.email").value(novoEmail));
    }

    @Test
    void clienteEditaEmailDocumentoEEnderecoSemAprovacao() throws Exception {
        var usuario = usuario(PerfilAcesso.CLIENTE);
        var cliente = cliente(usuario);
        var outro = cliente(usuario(PerfilAcesso.CLIENTE));
        var novoEmail = "cliente-" + UUID.randomUUID() + "@example.invalid";
        var verificacao = UUID.randomUUID();
        jdbc.update("insert into verificacoes_email(id,usuario_id,token_hash,email,expira_em) values(?,?,?, ?,now()+interval '1 hour')",
            verificacao, usuario.getId(), UUID.randomUUID().toString(), "anterior@example.invalid");
        mvc.perform(patch("/cliente/me").header("Authorization", token(usuario)).header("If-Match", cliente.getVersion())
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.ofEntries(
                Map.entry("id", outro.getId()), Map.entry("email", novoEmail), Map.entry("documento", "52998224725"),
                Map.entry("telefone", "85999998888"), Map.entry("logradouro", "Rua Nova"), Map.entry("numero", "80"),
                Map.entry("semNumero", false), Map.entry("bairro", "Centro"), Map.entry("cidade", "Fortaleza"), Map.entry("estado", "CE")))))
            .andExpect(status().isOk()).andExpect(jsonPath("id").value(cliente.getId().toString()))
            .andExpect(jsonPath("email").value(novoEmail)).andExpect(jsonPath("endereco").value("Rua Nova, 80"));
        assertThat(usuarios.findById(usuario.getId()).orElseThrow().getEmail()).isEqualTo(novoEmail);
        assertThat(clientes.findById(outro.getId()).orElseThrow().getDocumento()).isNull();
        assertThat(jdbc.queryForObject("select usado_em is not null from verificacoes_email where id=?", Boolean.class, verificacao)).isTrue();
    }

    @Test
    void rejeitaEmailDuplicadoVersaoAntigaEEdicaoDeOutroPerfil() throws Exception {
        var usuario = usuario(PerfilAcesso.ENTREGADOR);
        var e = entregador(usuario);
        var outro = usuario(PerfilAcesso.CLIENTE);
        cliente(outro);
        mvc.perform(patch("/operacao-entregador/perfil").header("Authorization", token(usuario))
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email", outro.getEmail()))))
            .andExpect(status().isConflict());
        mvc.perform(patch("/operacao-entregador/perfil").header("Authorization", token(usuario)).header("If-Match", e.getVersion() + 1)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"Alterado\"}"))
            .andExpect(status().isConflict());
        mvc.perform(patch("/cliente/me").header("Authorization", token(usuario))
            .contentType(MediaType.APPLICATION_JSON).content("{\"telefone\":\"85999998888\"}"))
            .andExpect(status().isForbidden());
        assertThat(entregadores.findById(e.getId()).orElseThrow().getEmail()).isEqualTo(usuario.getEmail());
    }

    @Test
    void validaChavePixEPlacaEPreservaEdicaoLegadaDeTelefone() throws Exception {
        var usuario = usuario(PerfilAcesso.ENTREGADOR);
        entregador(usuario);
        mvc.perform(patch("/operacao-entregador/perfil").header("Authorization", token(usuario))
            .contentType(MediaType.APPLICATION_JSON).content("{\"tipoChavePix\":\"CPF\",\"chavePix\":\"11111111111\",\"titularPix\":\"Teste\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(patch("/operacao-entregador/perfil").header("Authorization", token(usuario))
            .contentType(MediaType.APPLICATION_JSON).content("{\"placaVeiculo\":\"INVALIDA\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(patch("/operacao-entregador/perfil").header("Authorization", token(usuario))
            .contentType(MediaType.APPLICATION_JSON).content("{\"telefone\":\"85999998888\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("telefone").value("85999998888"));
    }

    private Usuario usuario(PerfilAcesso perfil) {
        var usuario = new Usuario(); usuario.setNome("Conta Teste"); usuario.setEmail(UUID.randomUUID() + "@example.invalid");
        usuario.setSenhaHash(encoder.encode("TesteSeguro123")); usuario.setPerfil(perfil);
        return usuarios.saveAndFlush(usuario);
    }
    private Entregador entregador(Usuario usuario) {
        var e = new Entregador(); e.setNome("Entregador Teste"); e.setCpf(UUID.randomUUID().toString().replace("-", "").substring(0, 11));
        e.setTelefone("85999990000"); e.setEmail(usuario.getEmail()); e.setTipoVeiculo(TipoVeiculo.MOTO); e.setUsuario(usuario);
        return entregadores.saveAndFlush(e);
    }
    private Cliente cliente(Usuario usuario) {
        var c = clienteMapper.toEntity(new ClienteRequest("Cliente Teste", "85999990000", null, usuario.getEmail(), null,
            "Rua A", "Centro", "Fortaleza", null)); c.setUsuario(usuario);
        return clientes.saveAndFlush(c);
    }
    private String token(Usuario usuario) { return "Bearer " + jwt.gerarToken(new UsuarioPrincipal(usuario)); }
}
