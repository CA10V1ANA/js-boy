package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.dto.ConversaDto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.*;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.*;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class PlanoImplementacaoIT extends AbstractIntegrationTest {

    @Autowired
    ConversaService chat;

    @Autowired
    PedidoClienteService pedidos;

    @Autowired
    SolicitacaoEntregaClienteService solicitacoes;

    @Autowired
    LgpdService lgpd;

    @Autowired
    JwtService jwt;

    @Autowired
    com.ravtec.delivery.security.IdentidadeAtual identidade;

    @Autowired
    org.springframework.boot.test.web.client.TestRestTemplate http;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    GoogleIdentidadeService google;

    @Autowired
    NotificacaoInternaService avisos;

    @Autowired
    CadastroClienteService cadastro;

    @Autowired
    EnderecoClienteService enderecos;

    @Autowired
    RecebimentoService recebimentos;

    @Autowired
    ParadaEntregaService paradas;

    @Autowired
    EntregadorService vinculos;

    @Autowired
    UsuarioRepository usuarios;

    @Autowired
    ClienteRepository clientes;

    @Autowired
    EntregadorRepository entregadores;

    @Autowired
    EntregaRepository entregas;

    @Autowired
    JdbcTemplate jdbc;

    private Usuario dono, cliente, courier;
    private Entrega entrega;
    private Entregador entregador;

    @BeforeEach
    void preparar() {
        dono = usuario(PerfilAcesso.PROPRIETARIO);
        cliente = usuario(PerfilAcesso.CLIENTE);
        courier = usuario(PerfilAcesso.ENTREGADOR);
        var c = new Cliente();
        c.setNome("Cliente teste");
        c.setTelefone("85999990002");
        c.setEmail(cliente.getEmail());
        c.setUsuario(cliente);
        c.setEndereco("Rua teste, 1");
        c.setLogradouro("Rua teste");
        c.setNumero("1");
        c.setBairro("Centro");
        c.setCidade("Fortaleza");
        c.setEstado("CE");
        c = clientes.saveAndFlush(c);
        entregador = entregador(courier);
        entrega = new Entrega();
        entrega.setCodigo("CHAT-" + UUID.randomUUID().toString().substring(0, 20));
        entrega.setCliente(c);
        entrega.setEntregador(entregador);
        entrega.setEnderecoOrigem("Rua origem");
        entrega.setBairroOrigem("Centro");
        entrega.setEnderecoDestino("Rua destino");
        entrega.setBairroDestino("Centro");
        entrega.setDestinatarioNome("Destinatário teste");
        entrega.setDestinatarioTelefone("85999990003");
        entrega.setDescricaoMercadoria("Caixa");
        entrega.setStatus(StatusEntrega.EM_ROTA);
        entrega = entregas.saveAndFlush(entrega);
        autenticar(cliente);
    }

    @AfterEach
    void limpar() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void conversaCompartilhadaEAutorNaoForjado() {
        var cv = chat.abrir(entrega.getId(), false);
        var envio = new Envio(UUID.randomUUID(), "Pode entrar pela lateral");
        var m = chat.enviar(cv.id(), false, envio);
        assertThat(m.autorId()).isEqualTo(cliente.getId());
        assertThat(m.contexto()).isEqualTo("CLIENTE");
        autenticar(courier);
        assertThat(chat.abrir(entrega.getId(), true).id()).isEqualTo(cv.id());
        assertThat(chat.mensagens(cv.id(), true, null, null)).hasSize(1);
        assertThat(avisos.contar(true)).isEqualTo(1);
        assertThat(chat.listar(true, "", true, 0)).hasSize(1);
        chat.ler(cv.id(), true, m.sequencia());
        assertThat(chat.listar(true, "", true, 0)).isEmpty();
        assertThat(avisos.contar(true)).isZero();
        autenticar(dono);
        assertThat(chat.consultar(cv.id(), false).codigo()).isEqualTo(entrega.getCodigo());
    }

    @Test
    void idempotenciaMantemTextoESaldo() {
        var cv = chat.abrir(entrega.getId(), false);
        var envio = new Envio(UUID.randomUUID(), "paguei e entreguei");
        var m = chat.enviar(cv.id(), false, envio);
        assertThat(chat.enviar(cv.id(), false, envio).id()).isEqualTo(m.id());
        assertThatThrownBy(() ->
            chat.enviar(cv.id(), false, new Envio(envio.envioId(), "outro texto"))
        ).isInstanceOf(ConflitoException.class);
        assertThat(entregas.findById(entrega.getId()).orElseThrow().getStatus()).isEqualTo(
            StatusEntrega.EM_ROTA
        );
        assertThat(
            jdbc.queryForObject(
                "select count(*) from pagamentos where entrega_id=?",
                Long.class,
                entrega.getId()
            )
        ).isZero();
    }

    @Test
    void acessoCruzadoEContextoOperacionalDoDono() {
        var cv = chat.abrir(entrega.getId(), false);
        autenticar(usuario(PerfilAcesso.CLIENTE));
        assertThatThrownBy(() -> chat.consultar(cv.id(), false)).isInstanceOf(
            org.springframework.security.access.AccessDeniedException.class
        );
        autenticar(dono);
        assertThatThrownBy(() -> chat.consultar(cv.id(), true)).isInstanceOf(
            org.springframework.security.access.AccessDeniedException.class
        );
        var proprio = entregador(dono);
        entrega.setEntregador(proprio);
        entrega = entregas.saveAndFlush(entrega);
        assertThat(chat.enviar(cv.id(), true, new Envio(UUID.randomUUID(), "Chegando")).contexto()).isEqualTo(
            "ENTREGADOR"
        );
        assertThat(
            chat
                .consultar(cv.id(), true)
                .participantes()
                .stream()
                .filter(p -> p.contains(dono.getNome()))
                .count()
        ).isEqualTo(1);
        proprio.setAtivo(false);
        entregadores.saveAndFlush(proprio);
        assertThatThrownBy(() -> chat.consultar(cv.id(), true)).isInstanceOf(
            org.springframework.security.access.AccessDeniedException.class
        );
        assertThat(chat.consultar(cv.id(), false)).isNotNull();
    }

    @Test
    void reatribuicaoRevogaHistoricoAvisosEEnvio() {
        var cv = chat.abrir(entrega.getId(), false);
        chat.enviar(cv.id(), false, new Envio(UUID.randomUUID(), "Referência"));
        var novo = usuario(PerfilAcesso.ENTREGADOR);
        entrega.setEntregador(entregador(novo));
        entrega = entregas.saveAndFlush(entrega);
        autenticar(courier);
        assertThat(chat.listar(true, "", false, 0)).isEmpty();
        assertThat(avisos.listar(true, false, 0)).isEmpty();
        assertThatThrownBy(() -> chat.mensagens(cv.id(), true, null, null)).isInstanceOf(
            RecursoNaoEncontradoException.class
        );
        assertThatThrownBy(() ->
            chat.enviar(cv.id(), true, new Envio(UUID.randomUUID(), "Intrusão"))
        ).isInstanceOf(RecursoNaoEncontradoException.class);
        autenticar(novo);
        assertThat(chat.mensagens(cv.id(), true, null, null)).hasSize(1);
    }

    @Test
    void leituraMonotonicaERecuperacaoIncremental() {
        var cv = chat.abrir(entrega.getId(), false);
        var a = chat.enviar(cv.id(), false, new Envio(UUID.randomUUID(), "primeira"));
        var b = chat.enviar(cv.id(), false, new Envio(UUID.randomUUID(), "segunda"));
        chat.ler(cv.id(), false, b.sequencia());
        chat.ler(cv.id(), false, a.sequencia());
        assertThat(
            jdbc.queryForObject(
                "select sequencia from leituras_conversa where conversa_id=? and usuario_id=?",
                Long.class,
                cv.id(),
                cliente.getId()
            )
        ).isEqualTo(b.sequencia());
        assertThat(chat.mensagens(cv.id(), false, a.sequencia(), null))
            .extracting(Mensagem::conteudo)
            .containsExactly("segunda");
        assertThatThrownBy(() -> chat.ler(cv.id(), false, 100)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void encerraCancelaEReabreComAuditoria() {
        var cv = chat.abrir(entrega.getId(), false);
        entrega.setStatus(StatusEntrega.ENTREGUE);
        entrega.setConcluidaEm(OffsetDateTime.now().minusHours(49));
        entrega = entregas.saveAndFlush(entrega);
        assertThat(chat.consultar(cv.id(), false).podeEnviar()).isFalse();
        assertThatThrownBy(() ->
            chat.enviar(cv.id(), false, new Envio(UUID.randomUUID(), "tarde"))
        ).isInstanceOf(ConflitoException.class);
        assertThatThrownBy(() ->
            chat.reabrir(cv.id(), new Reabertura("Revisar contato", OffsetDateTime.now().plusHours(1)))
        ).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        autenticar(dono);
        chat.reabrir(cv.id(), new Reabertura("Revisar contato", OffsetDateTime.now().plusHours(1)));
        assertThat(chat.consultar(cv.id(), false).podeEnviar()).isTrue();
        assertThat(entregas.findById(entrega.getId()).orElseThrow().getStatus()).isEqualTo(
            StatusEntrega.ENTREGUE
        );
        assertThat(
            jdbc.queryForObject(
                "select count(*) from auditorias where acao='CONVERSA_REABERTA' and entidade_id=?",
                Long.class,
                cv.id()
            )
        ).isEqualTo(1);
    }

    @Test
    void cancelamentoImediatoELimiteConteudo() {
        var cv = chat.abrir(entrega.getId(), false);
        assertThatThrownBy(() ->
            chat.enviar(cv.id(), false, new Envio(UUID.randomUUID(), "a".repeat(2001)))
        ).isInstanceOf(IllegalArgumentException.class);
        entrega.setStatus(StatusEntrega.CANCELADA);
        entrega = entregas.saveAndFlush(entrega);
        assertThat(chat.consultar(cv.id(), false).podeEnviar()).isFalse();
    }

    @Test
    void concorrenciaNaoDuplicaConversaNemEnvio() throws Exception {
        var pool = Executors.newFixedThreadPool(4);
        try {
            var tasks = new ArrayList<Callable<UUID>>();
            for (int i = 0; i < 4; i++) tasks.add(() -> {
                autenticar(cliente);
                try {
                    return chat.abrir(entrega.getId(), false).id();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            });
            var ids = pool.invokeAll(tasks);
            var id = ids.getFirst().get();
            for (var f : ids) assertThat(f.get()).isEqualTo(id);
            var envio = new Envio(UUID.randomUUID(), "Uma mensagem");
            tasks.clear();
            for (int i = 0; i < 4; i++) tasks.add(() -> {
                autenticar(cliente);
                try {
                    return chat.enviar(id, false, envio).id();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            });
            var messages = pool.invokeAll(tasks);
            var mid = messages.getFirst().get();
            for (var f : messages) assertThat(f.get()).isEqualTo(mid);
            assertThat(chat.mensagens(id, false, null, null)).hasSize(1);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void cadastroFixaClienteEVerificacaoExigeTokenDeUsoUnico() {
        var email = "cadastro-" + UUID.randomUUID() + "@example.invalid";
        var c = new ClienteRequest(
            "Novo cliente",
            "85999990001",
            null,
            email,
            null,
            "Rua teste",
            "Centro",
            "Fortaleza",
            null
        );
        cadastro.cadastrar(new CadastroClienteRequest(c, "SenhaNova12345!"), UUID.randomUUID().toString());
        var u = usuarios.findByEmail(email).orElseThrow();
        assertThat(u.getPerfil()).isEqualTo(PerfilAcesso.CLIENTE);
        assertThat(u.isEmailVerificado()).isFalse();
        assertThat(u.isAcessoAtivo()).isFalse();
        assertThatThrownBy(() -> cadastro.verificar("token-forjado")).isInstanceOf(
            org.springframework.security.authentication.BadCredentialsException.class
        );
        var tokens = new TokenSeguroService();
        var token = tokens.gerar();
        jdbc.update(
            "insert into verificacoes_email(id,usuario_id,token_hash,email,expira_em) values(?,?,?,?,?)",
            UUID.randomUUID(),
            u.getId(),
            tokens.hash(token),
            email,
            OffsetDateTime.now().plusHours(1)
        );
        cadastro.verificar(token);
        assertThat(usuarios.findById(u.getId()).orElseThrow().isEmailVerificado()).isTrue();
        assertThatThrownBy(() -> cadastro.verificar(token)).isInstanceOf(
            org.springframework.security.authentication.BadCredentialsException.class
        );
    }

    @Test
    void enderecoFrequenteNaoAlteraEntregaERejeitaOutroCliente() {
        var d = new EnderecoClienteDto.Dados(
            "Loja",
            "Rua nova",
            "Centro",
            "Fortaleza",
            "CE",
            "",
            null,
            null,
            "Contato",
            "85999990001"
        );
        var id = enderecos.salvar(null, null, d);
        assertThat(enderecos.listar()).hasSize(1);
        autenticar(usuario(PerfilAcesso.CLIENTE));
        assertThatThrownBy(() -> enderecos.excluir(id, 0L)).isInstanceOf(
            org.springframework.security.access.AccessDeniedException.class
        );
        autenticar(cliente);
        enderecos.excluir(id, 0L);
        assertThat(enderecos.listar()).isEmpty();
        assertThat(entregas.findById(entrega.getId()).orElseThrow().getEnderecoDestino()).isEqualTo(
            "Rua destino"
        );
    }

    @Test
    void operacionalDoDonoNaoIgnoraAtribuicao() {
        autenticar(dono);
        entregador(dono);
        assertThatThrownBy(() -> recebimentos.consultarOperacional(entrega.getId())).isInstanceOf(
            RecursoNaoEncontradoException.class
        );
        assertThatThrownBy(() -> paradas.listarOperacional(entrega.getId())).isInstanceOf(
            RecursoNaoEncontradoException.class
        );
    }

    @Test
    void desativarVinculoDoDonoPreservaContaAdministrativa() {
        autenticar(dono);
        var proprio = entregador(dono);
        vinculos.alterarStatus(proprio.getId(), new StatusRequest(false), proprio.getVersion());
        assertThat(usuarios.findById(dono.getId()).orElseThrow().isAtivo()).isTrue();
        assertThatThrownBy(() -> chat.listar(true, "", false, 0)).isInstanceOf(
            org.springframework.security.access.AccessDeniedException.class
        );
    }

    @Test
    void cadastroPublicoIgnoraPerfilForjadoNoPayload() {
        var email = "forjado-" + UUID.randomUUID() + "@example.invalid";
        var c = new ClienteRequest(
            "Cliente publico",
            "85999990001",
            null,
            email,
            null,
            "Rua teste",
            "Centro",
            "Fortaleza",
            null
        );
        var response = http.postForEntity(
            "/auth/cadastro-cliente",
            Map.of(
                "cliente",
                c,
                "senha",
                "SenhaForte12345!",
                "perfil",
                "PROPRIETARIO",
                "entregadorId",
                entregador.getId()
            ),
            String.class
        );
        assertThat(response.getStatusCode().value()).isEqualTo(202);
        assertThat(usuarios.findByEmail(email).orElseThrow().getPerfil()).isEqualTo(PerfilAcesso.CLIENTE);
    }

    @Test
    void googleNaoConcedePerfilInternoNemVinculaEmailAutomaticamente() {
        dono.setGoogleSub("sub-interno");
        dono = usuarios.saveAndFlush(dono);
        org.mockito.Mockito.when(google.verificar("interno")).thenReturn(
            new GoogleIdentidadeService.Identidade("sub-interno", dono.getEmail())
        );
        assertThatThrownBy(() ->
            cadastro.entrarGoogle("interno", null, UUID.randomUUID().toString())
        ).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
        org.mockito.Mockito.when(google.verificar("email-igual")).thenReturn(
            new GoogleIdentidadeService.Identidade("novo-sub", cliente.getEmail())
        );
        assertThatThrownBy(() ->
            cadastro.entrarGoogle("email-igual", null, UUID.randomUUID().toString())
        ).isInstanceOf(ConflitoException.class);
        assertThat(usuarios.findById(cliente.getId()).orElseThrow().getGoogleSub()).isNull();
    }

    @Test
    void paginacaoOrdenadaELimiteDeFrequenciaNaoPerdemHistorico() {
        var cv = chat.abrir(entrega.getId(), false);
        for (int i = 1; i <= 75; i++) jdbc.update(
            "insert into mensagens_conversa(id,conversa_id,sequencia,contexto,tipo,conteudo) values(?,?,?,'SISTEMA','SISTEMA',?)",
            UUID.randomUUID(),
            cv.id(),
            i,
            "Evento " + i
        );
        jdbc.update("update conversas set ultima_sequencia=75 where id=?", cv.id());
        var recentes = chat.mensagens(cv.id(), false, null, null);
        assertThat(recentes).hasSize(60);
        assertThat(recentes.getFirst().sequencia()).isEqualTo(16);
        assertThat(chat.mensagens(cv.id(), false, null, 16L)).hasSize(15);
        assertThat(chat.mensagens(cv.id(), false, 70L, null))
            .extracting(Mensagem::sequencia)
            .containsExactly(71L, 72L, 73L, 74L, 75L);
        for (int i = 0; i < 20; i++) chat.enviar(
            cv.id(),
            false,
            new Envio(UUID.randomUUID(), "Mensagem " + i)
        );
        assertThatThrownBy(() ->
            chat.enviar(cv.id(), false, new Envio(UUID.randomUUID(), "Excesso"))
        ).isInstanceOf(LimiteRequisicoesException.class);
    }

    @Test
    void clienteNaoEditaNemCancelaPedidoAposColeta() {
        assertThatThrownBy(() -> pedidos.consultar(entrega.getId())).isInstanceOf(ConflitoException.class);
        assertThatThrownBy(() ->
            pedidos.cancelar(entrega.getId(), entrega.getVersion(), "Mudança de plano")
        ).isInstanceOf(IllegalStateException.class);
        entrega.setStatus(StatusEntrega.CONFIRMADA);
        entrega = entregas.saveAndFlush(entrega);
        pedidos.cancelar(entrega.getId(), entrega.getVersion(), "Não preciso mais");
        assertThat(entregas.findById(entrega.getId()).orElseThrow().getStatus()).isEqualTo(
            StatusEntrega.CANCELADA
        );
        assertThat(
            jdbc.queryForObject(
                "select count(*) from auditorias where acao='CANCELAMENTO_CLIENTE' and entidade_id=?",
                Long.class,
                entrega.getId()
            )
        ).isEqualTo(1);
    }

    @Test
    void editarSolicitacaoRecalculaPrecoSemPermitirStatusOuDesignacao() {
        var r = new SolicitacaoEntregaClienteRequest(
            "Rua inicial",
            "Centro",
            "Rua destino",
            "Centro",
            "Contato",
            "85999990005",
            "Pacote",
            "Observação",
            java.math.BigDecimal.ZERO,
            null,
            null,
            null,
            null,
            FormaPagamento.DINHEIRO
        );
        var criada = solicitacoes.solicitar(r);
        var edicao = pedidos.consultar(criada.id());
        var revisada = new SolicitacaoEntregaClienteRequest(
            "Rua revisada",
            "Centro",
            "Rua destino",
            "Centro",
            "Outro contato",
            "85999990006",
            "Pacote revisado",
            "Nova observação",
            java.math.BigDecimal.ONE,
            null,
            null,
            null,
            null,
            FormaPagamento.PIX
        );
        var atual = pedidos.editar(criada.id(), edicao.versao(), revisada);
        assertThat(atual.status()).isEqualTo(StatusEntrega.SOLICITADA);
        assertThat(atual.enderecoOrigem()).isEqualTo("Rua revisada");
        assertThat(entregas.findById(criada.id()).orElseThrow().getEntregador()).isNull();
        assertThat(paradas.listar(criada.id()).getFirst().endereco()).contains("Rua revisada");
        assertThatThrownBy(() -> pedidos.editar(criada.id(), edicao.versao(), revisada)).isInstanceOf(
            ConflitoException.class
        );
    }

    @Test
    void apiDistingueDonoAdministrativoEOperacionalEClienteAlheio() {
        autenticar(dono);
        var proprio = entregador(dono);
        var headers = new org.springframework.http.HttpHeaders();
        headers.setBearerAuth(jwt.gerarToken(new UsuarioPrincipal(dono)));
        var request = new org.springframework.http.HttpEntity<>(headers);
        var op = http.exchange(
            "/operacao-entregador/recebimentos/" + entrega.getId(),
            org.springframework.http.HttpMethod.GET,
            request,
            String.class
        );
        assertThat(op.getStatusCode().value()).isEqualTo(404);
        assertThat(
            http
                .exchange(
                    "/recebimentos/entregas/" + entrega.getId(),
                    org.springframework.http.HttpMethod.GET,
                    request,
                    String.class
                )
                .getStatusCode()
                .value()
        ).isEqualTo(200);
        proprio.setAtivo(false);
        entregadores.saveAndFlush(proprio);
        assertThat(
            http
                .exchange(
                    "/operacao-entregador/perfil",
                    org.springframework.http.HttpMethod.GET,
                    request,
                    String.class
                )
                .getStatusCode()
                .value()
        ).isEqualTo(403);
        var outro = usuario(PerfilAcesso.CLIENTE);
        var c = new Cliente();
        c.setNome("Outro cliente");
        c.setTelefone("85999990007");
        c.setEndereco("Outra rua");
        c.setLogradouro("Outra rua");
        c.setNumero("1");
        c.setBairro("Centro");
        c.setCidade("Fortaleza");
        c.setUsuario(outro);
        clientes.saveAndFlush(c);
        headers.setBearerAuth(jwt.gerarToken(new UsuarioPrincipal(outro)));
        assertThat(
            http
                .exchange(
                    "/cliente/entregas/" + entrega.getId(),
                    org.springframework.http.HttpMethod.GET,
                    new org.springframework.http.HttpEntity<>(headers),
                    String.class
                )
                .getStatusCode()
                .value()
        ).isEqualTo(404);
    }

    @Test
    void conviteFixaEntregadorEVinculoProprioRejeitaOutroCadastro() {
        autenticar(dono);
        var livre = new Entregador();
        livre.setNome("Entregador convidado");
        livre.setCpf(UUID.randomUUID().toString().substring(0, 20));
        livre.setTelefone("85999990008");
        livre = entregadores.saveAndFlush(livre);
        var email = "convite-" + UUID.randomUUID() + "@example.invalid";
        vinculos.convidar(livre.getId(), email);
        var u = usuarios.findByEmail(email).orElseThrow();
        assertThat(u.getPerfilEfetivo()).isEqualTo(PerfilAcesso.ENTREGADOR);
        assertThat(
            jdbc.queryForObject(
                "select count(*) from password_reset_tokens where usuario_id=? and usado_em is null and expira_em>now()",
                Long.class,
                u.getId()
            )
        ).isEqualTo(1);
        var outro = entregador(dono);
        var id = livre.getId();
        assertThatThrownBy(() -> vinculos.vincularProprietario(id, identidade)).isInstanceOf(
            ConflitoException.class
        );
        assertThat(entregadores.findByUsuarioId(dono.getId()).orElseThrow().getId()).isEqualTo(outro.getId());
    }

    @Test
    void privacidadeIncluiNovosDadosEPreservaSequenciaFinanceira() {
        var cv = chat.abrir(entrega.getId(), false);
        chat.enviar(cv.id(), false, new Envio(UUID.randomUUID(), "Nome de contato privado"));
        enderecos.salvar(
            null,
            null,
            new EnderecoClienteDto.Dados(
                "Loja",
                "Rua nova",
                "Centro",
                "Fortaleza",
                "CE",
                "",
                null,
                null,
                "Contato",
                "85999990001"
            )
        );
        var clientId = entrega.getCliente().getId();
        assertThat((List<?>) lgpd.exportar(clientId).get("mensagensEnviadas")).hasSize(1);
        autenticar(dono);
        lgpd.anonimizar(clientId, "Solicitação do titular após análise");
        assertThat(
            jdbc.queryForObject(
                "select conteudo from mensagens_conversa where conversa_id=?",
                String.class,
                cv.id()
            )
        ).contains("anonimizada");
        assertThat(
            jdbc.queryForObject(
                "select count(*) from enderecos_cliente where cliente_id=?",
                Long.class,
                clientId
            )
        ).isZero();
        assertThat(entregas.findById(entrega.getId()).orElseThrow().getCodigo()).isEqualTo(
            entrega.getCodigo()
        );
    }

    private Usuario usuario(PerfilAcesso perfil) {
        var u = new Usuario();
        u.setNome("Conta " + UUID.randomUUID().toString().substring(0, 8));
        u.setEmail(UUID.randomUUID() + "@example.invalid");
        u.setSenhaHash("unused-test-hash");
        u.setPerfil(perfil);
        return usuarios.saveAndFlush(u);
    }

    private Entregador entregador(Usuario u) {
        var r = new Entregador();
        r.setNome(u.getNome());
        r.setCpf(UUID.randomUUID().toString().substring(0, 20));
        r.setTelefone("85999990001");
        r.setUsuario(u);
        return entregadores.saveAndFlush(r);
    }

    private void autenticar(Usuario u) {
        var p = new UsuarioPrincipal(u);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities())
        );
    }
}
