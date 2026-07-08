package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.ravtec.delivery.dto.DesignarEntregadorRequest;
import com.ravtec.delivery.dto.EntregaRequest;
import com.ravtec.delivery.dto.EntregaStatusRequest;
import com.ravtec.delivery.entity.Cliente;
import com.ravtec.delivery.entity.ConfiguracaoPreco;
import com.ravtec.delivery.entity.Entrega;
import com.ravtec.delivery.entity.Entregador;
import com.ravtec.delivery.entity.HistoricoEntrega;
import com.ravtec.delivery.entity.PerfilAcesso;
import com.ravtec.delivery.entity.StatusEntrega;
import com.ravtec.delivery.entity.Usuario;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.mapper.EntregaMapper;
import com.ravtec.delivery.repository.ClienteRepository;
import com.ravtec.delivery.repository.EntregaRepository;
import com.ravtec.delivery.repository.EntregadorRepository;
import com.ravtec.delivery.repository.HistoricoEntregaRepository;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class EntregaServiceTest {

    @Mock
    private EntregaRepository entregaRepository;
    @Mock
    private ClienteRepository clienteRepository;
    @Mock
    private EntregadorRepository entregadorRepository;
    @Mock
    private HistoricoEntregaRepository historicoEntregaRepository;
    @Mock
    private ConfiguracaoPrecoService configuracaoPrecoService;

    private EntregaService entregaService;
    private Usuario usuarioLogado;

    @BeforeEach
    void setUp() {
        entregaService = new EntregaService(
            entregaRepository, clienteRepository, entregadorRepository,
            historicoEntregaRepository, configuracaoPrecoService, new EntregaMapper()
        );

        usuarioLogado = new Usuario();
        usuarioLogado.setId(UUID.randomUUID());
        usuarioLogado.setNome("Proprietario Teste");
        usuarioLogado.setEmail("dono@jsboy.com");
        usuarioLogado.setPerfil(PerfilAcesso.PROPRIETARIO);
        usuarioLogado.setAtivo(true);

        var principal = new UsuarioPrincipal(usuarioLogado);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deveCalcularValorFinalComBaseNaConfiguracaoDePrecoAoCriar() {
        var cliente = criarCliente();
        var config = criarConfig();
        var request = new EntregaRequest(
            cliente.getId(), null, "Rua A", "Centro", "Rua B", "Vila Nova",
            "Joao", "11999998888", "Caixa pequena", null,
            new BigDecimal("5.00"), null, null
        );

        when(clienteRepository.findById(cliente.getId())).thenReturn(Optional.of(cliente));
        when(configuracaoPrecoService.buscarAtual()).thenReturn(config);
        when(configuracaoPrecoService.calcularValor(config, new BigDecimal("5.00"))).thenReturn(new BigDecimal("20.00"));
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = entregaService.criar(request);

        assertThat(response.valorCalculado()).isEqualByComparingTo("20.00");
        assertThat(response.valorFinal()).isEqualByComparingTo("20.00");
        assertThat(response.status()).isEqualTo(StatusEntrega.SOLICITADA);
    }

    @Test
    void deveMarcarStatusComoEntregadorDesignadoQuandoEntregadorInformadoNaCriacao() {
        var cliente = criarCliente();
        var entregador = criarEntregador();
        var config = criarConfig();
        var request = new EntregaRequest(
            cliente.getId(), entregador.getId(), "Rua A", "Centro", "Rua B", "Vila Nova",
            "Joao", "11999998888", "Caixa pequena", null,
            new BigDecimal("5.00"), null, null
        );

        when(clienteRepository.findById(cliente.getId())).thenReturn(Optional.of(cliente));
        when(entregadorRepository.findById(entregador.getId())).thenReturn(Optional.of(entregador));
        when(configuracaoPrecoService.buscarAtual()).thenReturn(config);
        when(configuracaoPrecoService.calcularValor(config, new BigDecimal("5.00"))).thenReturn(new BigDecimal("20.00"));
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = entregaService.criar(request);

        assertThat(response.status()).isEqualTo(StatusEntrega.ENTREGADOR_DESIGNADO);
    }

    @Test
    void deveLancarExcecaoAoDesignarEntregadorInexistente() {
        var entrega = criarEntrega();
        var entregadorId = UUID.randomUUID();
        when(entregaRepository.findById(entrega.getId())).thenReturn(Optional.of(entrega));
        when(entregadorRepository.findById(entregadorId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> entregaService.designarEntregador(entrega.getId(), new DesignarEntregadorRequest(entregadorId)))
            .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void deveNegarAlteracaoDeStatusQuandoEntregaNaoPertenceAoEntregadorLogado() {
        var outroEntregador = criarEntregador();
        var entrega = criarEntrega();
        entrega.setEntregador(outroEntregador);
        when(entregaRepository.findById(entrega.getId())).thenReturn(Optional.of(entrega));

        assertThatThrownBy(() -> entregaService.alterarStatusMinhaEntrega(entrega.getId(), new EntregaStatusRequest(StatusEntrega.COLETADA)))
            .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void devePermitirAlteracaoDeStatusQuandoEntregaPertenceAoEntregadorLogado() {
        var entregador = criarEntregador();
        entregador.setUsuario(usuarioLogado);
        var entrega = criarEntrega();
        entrega.setEntregador(entregador);
        when(entregaRepository.findById(entrega.getId())).thenReturn(Optional.of(entrega));

        var response = entregaService.alterarStatusMinhaEntrega(entrega.getId(), new EntregaStatusRequest(StatusEntrega.COLETADA));

        assertThat(response.status()).isEqualTo(StatusEntrega.COLETADA);
    }

    private Cliente criarCliente() {
        var cliente = new Cliente();
        cliente.setId(UUID.randomUUID());
        cliente.setNome("Cliente Teste");
        return cliente;
    }

    private Entregador criarEntregador() {
        var entregador = new Entregador();
        entregador.setId(UUID.randomUUID());
        entregador.setNome("Entregador Teste");
        entregador.setCpf("12345678900");
        entregador.setTelefone("11988887777");
        return entregador;
    }

    private ConfiguracaoPreco criarConfig() {
        var config = new ConfiguracaoPreco();
        config.setTaxaInicial(new BigDecimal("10.00"));
        config.setValorPorKm(new BigDecimal("2.00"));
        config.setValorMinimo(new BigDecimal("15.00"));
        return config;
    }

    private Entrega criarEntrega() {
        var entrega = new Entrega();
        entrega.setId(UUID.randomUUID());
        entrega.setCliente(criarCliente());
        entrega.setCodigo("JSB-TESTE");
        entrega.setStatus(StatusEntrega.ENTREGADOR_DESIGNADO);
        return entrega;
    }
}
