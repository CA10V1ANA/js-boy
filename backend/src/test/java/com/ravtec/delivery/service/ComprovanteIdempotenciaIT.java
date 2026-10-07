package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.ravtec.delivery.AbstractIntegrationTest;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.exception.RecursoNaoEncontradoException;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.UsuarioPrincipal;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.UUID;
import java.util.List;
import java.util.concurrent.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class ComprovanteIdempotenciaIT extends AbstractIntegrationTest {
    @Autowired private ComprovanteService service;
    @Autowired private ComprovanteEntregaRepository comprovantes;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private EntregadorRepository entregadores;
    @Autowired private ClienteRepository clientes;
    @Autowired private EntregaRepository entregas;
    @MockBean private ArmazenamentoArquivo storage;
    private Usuario usuario;
    private Entrega entrega;
    private byte[] foto;

    @BeforeEach
    void preparar() throws Exception {
        usuario = novoEntregador();
        var entregador = entregadores.findByUsuarioIdAndAtivoTrue(usuario.getId()).orElseThrow();
        var cliente = new Cliente();
        cliente.setNome("Cliente teste"); cliente.setTelefone("85999990000");
        cliente.setEndereco("Rua teste 1"); cliente.setLogradouro("Rua teste"); cliente.setNumero("1");
        cliente.setBairro("Centro"); cliente.setCidade("Fortaleza"); cliente.setEstado("CE");
        cliente = clientes.saveAndFlush(cliente);
        entrega = new Entrega(); entrega.setCodigo("IT-" + UUID.randomUUID().toString().substring(0, 20));
        entrega.setCliente(cliente); entrega.setEntregador(entregador);
        entrega.setEnderecoOrigem("Origem"); entrega.setBairroOrigem("Centro");
        entrega.setEnderecoDestino("Destino"); entrega.setBairroDestino("Centro");
        entrega.setDestinatarioNome("Recebedor"); entrega.setDestinatarioTelefone("85999990001");
        entrega.setDescricaoMercadoria("Teste"); entrega = entregas.saveAndFlush(entrega);
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", output);
        foto = output.toByteArray();
    }

    @Test
    void duasTentativasSimultaneasIdenticasGeramUmRegistroEUmArquivo() throws Exception {
        var resultados = concorrentes("original", "original");
        assertThat(resultados).allMatch(UUID.class::isInstance);
        assertThat(resultados.get(0)).isEqualTo(resultados.get(1));
        assertThat(comprovantes.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId())).isEqualTo(1);
        verify(storage, times(1)).salvar(anyString(), any(byte[].class));
    }

    @Test
    void payloadsSimultaneosDiferentesTemUmVencedorEUmConflito() throws Exception {
        var resultados = concorrentes("primeira", "segunda");
        assertThat(resultados.stream().filter(UUID.class::isInstance).count()).isEqualTo(1);
        assertThat(resultados.stream().filter(ConflitoException.class::isInstance).count()).isEqualTo(1);
        assertThat(comprovantes.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId())).isEqualTo(1);
        verify(storage, times(1)).salvar(anyString(), any(byte[].class));
    }

    @Test
    void perdaDeRespostaPermiteRetryMasNaoAcessoDeOutroEntregador() {
        var id = criar(usuario, "retry-resposta", "original");
        assertThat(criar(usuario, "retry-resposta", "original")).isEqualTo(id);
        var outro = novoEntregador();
        assertThatThrownBy(() -> criar(outro, "retry-resposta", "original"))
            .isInstanceOf(RecursoNaoEncontradoException.class);
        verify(storage, times(1)).salvar(anyString(), any(byte[].class));
        assertThat(comprovantes.countByEntregaIdAndSubstituidoPorIsNull(entrega.getId())).isEqualTo(1);
    }

    private List<Object> concorrentes(String primeira, String segunda) throws Exception {
        var prontos = new CountDownLatch(2);
        var iniciar = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a = executor.submit(tentativa(primeira, prontos, iniciar));
            var b = executor.submit(tentativa(segunda, prontos, iniciar));
            try {
                assertThat(prontos.await(10, TimeUnit.SECONDS)).isTrue();
            } finally {
                iniciar.countDown();
            }
            return List.of(a.get(30, TimeUnit.SECONDS), b.get(30, TimeUnit.SECONDS));
        }
    }

    private Callable<Object> tentativa(String observacao, CountDownLatch prontos, CountDownLatch iniciar) {
        return () -> {
            prontos.countDown();
            if (!iniciar.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Teste não iniciado");
            try { return criar(usuario, "concorrente", observacao); }
            catch (ConflitoException e) { return e; }
        };
    }

    private UUID criar(Usuario identidade, String chave, String observacao) {
        var principal = new UsuarioPrincipal(identidade);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        try {
            return service.criar(entrega.getId(), null, TipoComprovante.COLETA, chave,
                new MockMultipartFile("arquivo", "foto.png", "image/png", foto),
                null, null, null, null, null, false, observacao).id();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private Usuario novoEntregador() {
        var user = new Usuario(); user.setNome("Entregador teste");
        user.setEmail("proof-" + UUID.randomUUID() + "@example.invalid");
        user.setSenhaHash("not-used"); user.setPerfil(PerfilAcesso.ENTREGADOR); user.setAtivo(true);
        user = usuarios.saveAndFlush(user);
        var driver = new Entregador(); driver.setNome("Entregador teste");
        driver.setCpf(UUID.randomUUID().toString().substring(0, 20)); driver.setTelefone("85999990002");
        driver.setUsuario(user); entregadores.saveAndFlush(driver);
        return user;
    }
}
