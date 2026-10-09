package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class RecebimentoDiretoIT extends AbstractIntegrationTest {
    @Autowired RecebimentoService recebimentos;
    @Autowired PagamentoService financeiro;
    @Autowired EntregaService operacao;
    @Autowired ParadaEntregaService rota;
    @Autowired SincronizacaoOfflineService offline;
    @Autowired UsuarioRepository usuarios;
    @Autowired ClienteRepository clientes;
    @Autowired EntregadorRepository entregadores;
    @Autowired EntregaRepository entregas;
    @Autowired ParadaEntregaRepository paradas;
    @Autowired PagamentoRepository pagamentos;
    @Autowired ComprovanteEntregaRepository comprovantes;
    @Autowired CobrancaPixRepository cobrancas;
    @Autowired FechamentoFinanceiroRepository fechamentos;
    @Autowired OcorrenciaEntregaService ocorrencias;
    private Usuario dono, courier;
    private Entrega entrega;

    @BeforeEach void preparar() {
        dono = usuario(PerfilAcesso.PROPRIETARIO);
        courier = usuario(PerfilAcesso.ENTREGADOR);
        var r = new Entregador(); r.setNome("Recebedor teste"); r.setCpf(UUID.randomUUID().toString().substring(0, 20));
        r.setTelefone("85999990001"); r.setUsuario(courier); r.setTipoChavePix(TipoChavePix.EMAIL);
        r.setChavePix("recebedor@example.invalid"); r.setTitularPix("Titular teste"); r = entregadores.saveAndFlush(r);
        var c = new Cliente(); c.setNome("Cliente teste"); c.setTelefone("85999990002");
        c.setEndereco("Rua teste 1"); c.setLogradouro("Rua teste"); c.setNumero("1");
        c.setBairro("Centro"); c.setCidade("Fortaleza"); c.setEstado("CE"); c = clientes.saveAndFlush(c);
        entrega = new Entrega(); entrega.setCodigo("REC-" + UUID.randomUUID().toString().substring(0, 20));
        entrega.setCliente(c); entrega.setEntregador(r); entrega.setEnderecoOrigem("Rua origem");
        entrega.setBairroOrigem("Centro"); entrega.setEnderecoDestino("Rua destino"); entrega.setBairroDestino("Centro");
        entrega.setDestinatarioNome("Destinatário"); entrega.setDestinatarioTelefone("85999990003");
        entrega.setDescricaoMercadoria("Caixa"); entrega.setValorFinal(new BigDecimal("100.00"));
        entrega.setFormaPagamento(FormaPagamento.PIX); entrega.setStatus(StatusEntrega.EM_ROTA);
        entrega = entregas.saveAndFlush(entrega);
        autenticar(dono); rota.substituir(entrega, null);
    }

    @AfterEach void limparIdentidade() { SecurityContextHolder.clearContext(); }

    @Test void criacaoRetornaVersaoPersistidaAposProjetarRota() {
        var criada = operacao.criar(new EntregaRequest(
            entrega.getCliente().getId(), entrega.getEntregador().getId(),
            "Origem resumida", "Centro", "Destino resumido", "Centro",
            "Contato inicial", "85999990003", "Caixa teste", null,
            BigDecimal.ZERO, new BigDecimal("80.00"), null, TipoVeiculo.MOTO, 0, false,
            new BigDecimal("80.00"), FormaPagamento.DINHEIRO,
            List.of(local(1, TipoParada.COLETA, "Rua coleta"),
                local(2, TipoParada.COLETA, "Rua segunda coleta"),
                local(3, TipoParada.ENTREGA, "Rua destino"))));
        assertThat(criada.versao()).isEqualTo(entregas.findById(criada.id()).orElseThrow().getVersion());
        assertThat(operacao.alterarStatus(criada.id(),
            new EntregaStatusRequest(StatusEntrega.COLETADA), criada.versao()).status())
            .isEqualTo(StatusEntrega.COLETADA);
    }

    @Test void cotacaoPendenteNaoPodeSerAprovadaComoEntregaGratuita() {
        entrega.setStatus(StatusEntrega.SOLICITADA); entrega.setValorFinal(BigDecimal.ZERO);
        entrega.setOrigemPreco(OrigemPreco.NEGOCIADO); entrega.setValorNegociado(null);
        entrega = entregas.saveAndFlush(entrega);
        assertThatThrownBy(() -> operacao.alterarStatus(entrega.getId(), new EntregaStatusRequest(StatusEntrega.CONFIRMADA)))
            .isInstanceOf(IllegalStateException.class).hasMessageContaining("valor negociado");
        entrega.setValorNegociado(BigDecimal.ZERO); entrega = entregas.saveAndFlush(entrega);
        assertThat(operacao.alterarStatus(entrega.getId(), new EntregaStatusRequest(StatusEntrega.CONFIRMADA)).status())
            .isEqualTo(StatusEntrega.CONFIRMADA);
    }

    @Test void ocorrenciaNaoDesfazConclusaoNemAvancaSobreParadasPendentes() {
        autenticar(courier);
        var locais = rota.listar(entrega.getId());
        assertThatThrownBy(() -> ocorrencias.registrar(entrega.getId(), new OcorrenciaRequest(
            locais.get(1).id(), TipoOcorrencia.DESTINATARIO_AUSENTE, "Ausente", null, "Tentar novamente")))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("anteriores");
        var concluida = rota.concluirMinhaParada(entrega.getId(), locais.get(0).id(), locais.get(0).versao());
        assertThatThrownBy(() -> ocorrencias.registrar(entrega.getId(), new OcorrenciaRequest(
            concluida.id(), TipoOcorrencia.DESTINATARIO_AUSENTE, "Ausente", null, "Tentar novamente")))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("concluída");
        var preservada = rota.listar(entrega.getId()).get(0);
        assertThat(preservada.status()).isEqualTo(StatusParada.CONCLUIDA);
        assertThat(preservada.realizadaEm()).isEqualTo(concluida.realizadaEm());
        ocorrencias.registrar(entrega.getId(), new OcorrenciaRequest(
            locais.get(1).id(), TipoOcorrencia.DESTINATARIO_AUSENTE, "Ausente", null, "Tentar novamente"));
        assertThat(entregas.findById(entrega.getId()).orElseThrow().getStatus()).isEqualTo(StatusEntrega.TENTATIVA_FALHOU);
    }

    @Test void rotaERecebimentoPermitemFinalizarSemComprovanteInclusiveOffline() {
        autenticar(courier);
        concluirRota();
        assertThatThrownBy(() -> offline.alterarStatus(entrega.getId(), new EntregaStatusRequest(StatusEntrega.ENTREGUE), "offline-pendente"))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("Pix");
        var parcial = confirmar("30.00", "parcial-1");
        assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isFalse();
        var finalizado = confirmar("70.00", "saldo-final");
        assertThat(parcial.recebedorId()).isEqualTo(entrega.getEntregador().getId());
        assertThat(finalizado.usuarioResponsavelNome()).isEqualTo(courier.getNome());
        assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isTrue();
        assertThat(offline.alterarStatus(entrega.getId(), new EntregaStatusRequest(StatusEntrega.ENTREGUE), "offline-final").status())
            .isEqualTo(StatusEntrega.ENTREGUE);
        assertThat(comprovantes.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId())).isZero();
    }

    @Test void dinheiroTemConfirmacaoPropriaEPaiPodeConfirmarComContaDeProprietario() {
        entrega.setFormaPagamento(FormaPagamento.DINHEIRO); entrega = entregas.saveAndFlush(entrega);
        var r = entrega.getEntregador(); r.setUsuario(null); entregadores.saveAndFlush(r);
        autenticar(dono);
        var estado = recebimentos.consultar(entrega.getId());
        assertThat(estado.chavePix()).isNull();
        assertThat(estado.recebidoConfirmado()).isFalse();
        assertThat(confirmar("100.00", "dinheiro-dono").formaPagamento()).isEqualTo(FormaPagamento.DINHEIRO);
        assertThat(recebimentos.consultar(entrega.getId()).recebidoConfirmado()).isTrue();
        assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isFalse();
        concluirRota(); assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isTrue();
    }

    @Test void clienteEOutroEntregadorNaoConfirmamRecebimento() {
        var estado = recebimentos.consultar(entrega.getId());
        var req = new ConfirmarRecebimentoRequest(new BigDecimal("100.00"), FormaPagamento.PIX, estado.referenciaRecebedor());
        autenticar(usuario(PerfilAcesso.CLIENTE));
        assertThatThrownBy(() -> recebimentos.confirmar(entrega.getId(), "negado-cliente", req)).isInstanceOf(AccessDeniedException.class);
        autenticar(usuario(PerfilAcesso.ENTREGADOR));
        assertThatThrownBy(() -> recebimentos.confirmar(entrega.getId(), "negado-entregador", req)).isInstanceOf(AccessDeniedException.class);
        assertThat(pagamentos.findByEntregaId(entrega.getId())).isEmpty();
    }

    @Test void confirmacoesConcorrentesERespostaPerdidaGeramUmLancamento() throws Exception {
        var req = new ConfirmarRecebimentoRequest(new BigDecimal("100.00"), FormaPagamento.PIX,
            recebimentos.consultar(entrega.getId()).referenciaRecebedor());
        var start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<UUID> tentativa = () -> { autenticar(courier); start.await();
                try { return recebimentos.confirmar(entrega.getId(), "recebimento-concorrente", req).id(); }
                finally { SecurityContextHolder.clearContext(); } };
            var a = pool.submit(tentativa); var b = pool.submit(tentativa); start.countDown();
            assertThat(a.get(30, TimeUnit.SECONDS)).isEqualTo(b.get(30, TimeUnit.SECONDS));
        }
        assertThat(recebimentos.confirmar(entrega.getId(), "recebimento-concorrente", req).id()).isNotNull();
        assertThat(pagamentos.findByEntregaId(entrega.getId())).hasSize(1);
        assertThatThrownBy(() -> recebimentos.confirmar(entrega.getId(), "outra-chave", req))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("saldo");
    }

    @Test void chaveAlteradaExigeConferenciaEEstornoRetiraLiberacao() {
        var antes = recebimentos.consultar(entrega.getId());
        var r = entrega.getEntregador(); r.setChavePix("nova@example.invalid"); entregadores.saveAndFlush(r);
        assertThatThrownBy(() -> recebimentos.confirmar(entrega.getId(), "chave-desatualizada",
            new ConfirmarRecebimentoRequest(new BigDecimal("100.00"), FormaPagamento.PIX, antes.referenciaRecebedor())))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("Recarregue");
        var pagamento = confirmar("100.00", "chave-atualizada"); concluirRota();
        assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isTrue();
        financeiro.estornar(pagamento.id(), "estorno-direto", new EstornoRequest(new BigDecimal("20.00"), "Correção"));
        assertThat(recebimentos.consultar(entrega.getId()).recebidoConfirmado()).isFalse();
        assertThat(recebimentos.consultar(entrega.getId()).saldo()).isEqualByComparingTo("20.00");
        assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isFalse();
    }

    @Test void futurasNaoIgnoramOrdemEConclusaoRepetidaNaoDuplicaAuditoriaOuHorario() {
        var locais = rota.listar(entrega.getId());
        assertThatThrownBy(() -> rota.concluirMinhaParada(entrega.getId(), locais.get(1).id(), locais.get(1).versao()))
            .isInstanceOf(IllegalStateException.class).hasMessageContaining("anteriores");
        var concluida = rota.concluirMinhaParada(entrega.getId(), locais.get(0).id(), locais.get(0).versao());
        var repetida = rota.concluirMinhaParada(entrega.getId(), locais.get(0).id(), locais.get(0).versao());
        assertThat(repetida.realizadaEm()).isEqualTo(concluida.realizadaEm());
        assertThat(repetida.usuarioConclusaoNome()).isEqualTo(dono.getNome());
    }

    @Test void conclusaoRegistraRecebedorEObservacaoOpcionalSemFotoNemCodigo() {
        autenticar(courier);
        var locais = rota.listar(entrega.getId());
        var coleta = rota.concluirMinhaParada(entrega.getId(), locais.get(0).id(), locais.get(0).versao(),
            new ConcluirParadaRequest("Não se aplica à coleta", null));
        assertThat(coleta.recebedorNome()).isNull();
        var entregue = rota.concluirMinhaParada(entrega.getId(), locais.get(1).id(), locais.get(1).versao(),
            new ConcluirParadaRequest("  Alysson ", "   "));
        assertThat(entregue.recebedorNome()).isEqualTo("Alysson");
        assertThat(entregue.observacaoConclusao()).isNull();
        assertThat(comprovantes.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId())).isZero();
    }

    @Test void rotaEditadaPreservaIdsEProjecaoEBloqueiaVersaoAntiga() {
        entrega.setStatus(StatusEntrega.ENTREGADOR_DESIGNADO); entrega.setValorNegociado(new BigDecimal("100.00"));
        entrega = entregas.saveAndFlush(entrega);
        var locais = rota.listar(entrega.getId());
        var req = new EditarRotaRequest(List.of(
            new EditarRotaRequest.Item(locais.get(0).id(), locais.get(0).versao(), local(1, TipoParada.COLETA, "Nova origem")),
            new EditarRotaRequest.Item(null, null, local(2, TipoParada.COLETA, "Coleta B")),
            new EditarRotaRequest.Item(null, null, local(3, TipoParada.ENTREGA, "Entrega C")),
            new EditarRotaRequest.Item(locais.get(1).id(), locais.get(1).versao(), local(4, TipoParada.ENTREGA, "Destino D"))));
        var resposta = rota.editar(entrega.getId(), entrega.getVersion(), req);
        assertThat(resposta).hasSize(4);
        assertThat(resposta.get(0).id()).isEqualTo(locais.get(0).id());
        assertThat(resposta.get(3).id()).isEqualTo(locais.get(1).id());
        assertThat(entregas.findById(entrega.getId()).orElseThrow().getEnderecoDestino()).isEqualTo("Destino D, 1");
        assertThatThrownBy(() -> rota.editar(entrega.getId(), entrega.getVersion(), req)).isInstanceOf(ConflitoException.class);
    }

    @Test void valorZeroExigeSomenteRotaEBloqueiaRotaAusente() {
        entrega.setValorFinal(BigDecimal.ZERO); entrega = entregas.saveAndFlush(entrega);
        assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isFalse();
        concluirRota();
        assertThat(recebimentos.consultar(entrega.getId()).podeFinalizar()).isTrue();
        assertThat(pagamentos.findByEntregaId(entrega.getId())).isEmpty();
    }

    @Test void recebimentoBloqueiaTrocaDeRecebedorFormaEPrecoAteEstornoExplicito() {
        entrega.setStatus(StatusEntrega.ENTREGADOR_DESIGNADO); entrega = entregas.saveAndFlush(entrega);
        var pago = confirmar("100.00", "recebimento-edicao");
        var outro = new Entregador(); outro.setNome("Outro recebedor");
        outro.setCpf(UUID.randomUUID().toString().substring(0, 20)); outro.setTelefone("85999990009");
        outro = entregadores.saveAndFlush(outro);
        var idOutro = outro.getId();
        assertThatThrownBy(() -> operacao.designarEntregador(entrega.getId(), new DesignarEntregadorRequest(idOutro)))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("Concilie");
        assertThatThrownBy(() -> operacao.atualizar(entrega.getId(), editar(FormaPagamento.DINHEIRO, "100.00")))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("Concilie");
        assertThatThrownBy(() -> operacao.atualizar(entrega.getId(), editar(FormaPagamento.PIX, "120.00")))
            .isInstanceOf(ConflitoException.class).hasMessageContaining("Concilie");
        financeiro.estornar(pago.id(), "estorno-edicao", new EstornoRequest(new BigDecimal("100.00"), "Troca conciliada"));
        operacao.atualizar(entrega.getId(), editar(FormaPagamento.DINHEIRO, "100.00"));
        assertThat(recebimentos.consultar(entrega.getId()).recebidoConfirmado()).isFalse();
        assertThat(recebimentos.consultar(entrega.getId()).formaPagamento()).isEqualTo(FormaPagamento.DINHEIRO);
    }

    @Test void periodoFechadoBloqueiaConfirmacaoSemGerarLancamento() {
        var f = new FechamentoFinanceiro();
        f.setInicio(java.time.LocalDate.now().minusDays(1)); f.setFim(java.time.LocalDate.now().plusDays(1));
        f.setFechadoEm(java.time.OffsetDateTime.now()); f.setUsuarioFechamento(dono); f = fechamentos.saveAndFlush(f);
        try {
            assertThatThrownBy(() -> confirmar("100.00", "periodo-fechado"))
                .isInstanceOf(ConflitoException.class).hasMessageContaining("fechado");
            assertThat(pagamentos.findByEntregaId(entrega.getId())).isEmpty();
        } finally {
            f.setReabertoEm(java.time.OffsetDateTime.now()); f.setUsuarioReabertura(dono);
            f.setMotivoReabertura("Limpeza do cenário de teste isolado"); fechamentos.saveAndFlush(f);
        }
    }

    @Test void cobrancaLegadaPendenteBloqueiaManualSemAlterarStatusPorSuposicao() {
        var c = new CobrancaPix(); c.setEntrega(entrega); c.setSolicitante(dono); c.setValor(new BigDecimal("100.00"));
        c.setEmailPagador("payer@example.invalid"); c.setExpiraEm(java.time.OffsetDateTime.now().plusMinutes(20));
        cobrancas.saveAndFlush(c);
        assertThat(recebimentos.consultar(entrega.getId()).podeConfirmar()).isFalse();
        assertThatThrownBy(() -> confirmar("100.00", "legado-pendente")).isInstanceOf(ConflitoException.class).hasMessageContaining("pendente");
        assertThat(cobrancas.findByEntregaId(entrega.getId()).orElseThrow().getStatus()).isEqualTo("PENDENTE");
    }

    private PagamentoResponse confirmar(String valor, String chave) {
        var estado = recebimentos.consultar(entrega.getId());
        return recebimentos.confirmar(entrega.getId(), chave + ":" + entrega.getId(),
            new ConfirmarRecebimentoRequest(new BigDecimal(valor), estado.formaPagamento(), estado.referenciaRecebedor()));
    }
    private EntregaRequest editar(FormaPagamento forma, String valor) {
        return new EntregaRequest(entrega.getCliente().getId(), entrega.getEntregador().getId(),
            entrega.getEnderecoOrigem(), entrega.getBairroOrigem(), entrega.getEnderecoDestino(), entrega.getBairroDestino(),
            entrega.getDestinatarioNome(), entrega.getDestinatarioTelefone(), entrega.getDescricaoMercadoria(), null,
            BigDecimal.ZERO, new BigDecimal(valor), "Valor acordado para o teste", TipoVeiculo.MOTO, 0, false,
            null, forma, null);
    }
    private void concluirRota() {
        for (var p : rota.listar(entrega.getId())) rota.concluirMinhaParada(entrega.getId(), p.id(), p.versao());
    }
    private Usuario usuario(PerfilAcesso perfil) {
        var u = new Usuario(); u.setNome("Teste " + perfil); u.setEmail(UUID.randomUUID() + "@example.invalid");
        u.setSenhaHash("test-only-hash"); u.setPerfil(perfil); return usuarios.saveAndFlush(u);
    }
    private void autenticar(Usuario usuario) {
        var principal = new UsuarioPrincipal(usuario);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
    private ParadaRequest local(int ordem, TipoParada tipo, String rua) {
        return new ParadaRequest(ordem, tipo, rua, "1", false, null, "Centro", "Fortaleza", "CE", "60000000", null, null, null, null);
    }
}
