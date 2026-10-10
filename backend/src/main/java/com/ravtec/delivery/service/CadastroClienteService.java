package com.ravtec.delivery.service;

import com.ravtec.delivery.dto.*;
import com.ravtec.delivery.entity.*;
import com.ravtec.delivery.exception.ConflitoException;
import com.ravtec.delivery.mapper.ClienteMapper;
import com.ravtec.delivery.repository.*;
import com.ravtec.delivery.security.IdentidadeAtual;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
@RequiredArgsConstructor
public class CadastroClienteService {

    private final UsuarioRepository usuarios;
    private final ClienteRepository clientes;
    private final ClienteMapper mapper;
    private final ClienteService validacao;
    private final PasswordEncoder encoder;
    private final TokenSeguroService tokens;
    private final JdbcTemplate jdbc;
    private final ResendEmailClient email;
    private final GoogleIdentidadeService google;
    private final LimiteRequisicoesPublicasService limitador;

    @Value("${app.password-reset.provider:local}")
    private String provedor;

    @Value("${app.frontend-url:${PUBLIC_FRONTEND_URL:http://localhost:5173}}")
    private String frontend;

    @Transactional
    public void cadastrar(CadastroClienteRequest request, String origem) {
        limitar(origem);
        validarSenha(request.senha());
        var u = criar(request.cliente(), encoder.encode(request.senha()), false, null);
        enviarVerificacao(u, u.getEmail());
    }

    public void limitar(String origem) {
        limitador.verificar("cadastro-cliente", origem, 5, Duration.ofHours(1));
    }

    private Usuario criar(ClienteRequest c, String hash, boolean verificado, String sub) {
        validacao.validarCadastroPublico(c);
        if (c.email() == null || c.email().isBlank()) throw new IllegalArgumentException("Informe o e-mail");
        var enderecoEmail = c.email().trim().toLowerCase(Locale.ROOT);
        if (usuarios.findByEmail(enderecoEmail).isPresent()) throw new ConflitoException(
            "E-mail já cadastrado; entre na conta existente"
        );
        var u = new Usuario();
        u.setNome(c.nome().trim());
        u.setEmail(enderecoEmail);
        u.setSenhaHash(hash);
        u.setPerfil(PerfilAcesso.CLIENTE);
        u.setEmailVerificado(verificado);
        u.setGoogleSub(sub);
        u.setSenhaLocal(sub == null);
        u = usuarios.saveAndFlush(u);
        var cliente = mapper.toEntity(c);
        cliente.setUsuario(u);
        clientes.saveAndFlush(cliente);
        u.setCliente(cliente);
        return u;
    }

    public void enviarVerificacao(Usuario usuario, String destino) {
        var token = tokens.gerar();
        jdbc.update(
            "insert into verificacoes_email(id,usuario_id,token_hash,email,expira_em) values(?,?,?,?,?)",
            UUID.randomUUID(),
            usuario.getId(),
            tokens.hash(token),
            destino,
            OffsetDateTime.now().plusHours(24)
        );
        if ("resend".equals(provedor)) {
            var link = UriComponentsBuilder.fromUriString(frontend)
                .path("/verificar-email")
                .queryParam("token", token)
                .build()
                .toUriString();
            email.enviar(
                destino,
                "Confirme seu e-mail - JS Boy",
                "Confirme seu e-mail acessando: " + link + "\nO link é de uso único e expira em 24 horas.",
                "verify-" + UUID.nameUUIDFromBytes(token.getBytes(StandardCharsets.UTF_8))
            );
        } else log.info("security_event=email_verification_requested result=accepted destination=masked");
    }

    @Transactional
    public void verificar(String token) {
        var usuarioId = jdbc.query(
            "select usuario_id from verificacoes_email where token_hash=?",
            (r, n) -> r.getObject(1, UUID.class),
            tokens.hash(token)
        );
        if (usuarioId.isEmpty()) throw new BadCredentialsException("Verificação inválida ou expirada");
        // Serialize distinct verification tokens for the same account before consuming them.
        jdbc.queryForObject(
            "select id from usuarios where id=? for update",
            UUID.class,
            usuarioId.getFirst()
        );
        var itens = jdbc.query(
            "select * from verificacoes_email where token_hash=? and usado_em is null and expira_em>now() for update",
            (r, n) ->
                Map.of(
                    "id",
                    r.getObject("id", UUID.class),
                    "usuario",
                    r.getObject("usuario_id", UUID.class),
                    "email",
                    r.getString("email")
                ),
            tokens.hash(token)
        );
        if (itens.isEmpty()) throw new BadCredentialsException("Verificação inválida ou expirada");
        var item = itens.getFirst();
        var u = usuarios.findById((UUID) item.get("usuario")).orElseThrow();
        if (u.getPerfilEfetivo() != PerfilAcesso.CLIENTE) throw new BadCredentialsException(
            "Verificação indisponível"
        );
        u.setEmail((String) item.get("email"));
        u.setEmailVerificado(true);
        u.getCliente().setEmail(u.getEmail());
        jdbc.update("update verificacoes_email set usado_em=now() where usuario_id=?", u.getId());
    }

    @Transactional
    public void reenviar(String destino, String origem) {
        limitar(origem);
        usuarios
            .findByEmail(destino.trim().toLowerCase(Locale.ROOT))
            .filter(u -> u.getPerfilEfetivo() == PerfilAcesso.CLIENTE && !u.isEmailVerificado())
            .ifPresent(u -> enviarVerificacao(u, u.getEmail()));
    }

    @Transactional
    public Usuario entrarGoogle(String credencial, ClienteRequest cadastro, String origem) {
        limitador.verificar("google-login", origem, 30, Duration.ofMinutes(1));
        var identidade = google.verificar(credencial);
        var existente = usuarios.findByGoogleSub(identidade.sub());
        if (existente.isPresent()) {
            var u = existente.get();
            if (
                u.getPerfilEfetivo() != PerfilAcesso.CLIENTE || !u.isAcessoAtivo()
            ) throw new BadCredentialsException("Acesso indisponível");
            return u;
        }
        if (usuarios.findByEmail(identidade.email()).isPresent()) throw new ConflitoException(
            "Entre com sua senha e vincule o Google em Minha conta"
        );
        if (cadastro == null) throw new ConflitoException(
            "Complete o cadastro de cliente para continuar com Google",
            "GOOGLE_CADASTRO_NECESSARIO"
        );
        var c = new ClienteRequest(
            cadastro.nome(),
            cadastro.telefone(),
            cadastro.whatsapp(),
            identidade.email(),
            cadastro.documento(),
            cadastro.endereco(),
            cadastro.bairro(),
            cadastro.cidade(),
            cadastro.observacoes(),
            cadastro.cep(),
            cadastro.logradouro(),
            cadastro.numero(),
            cadastro.complemento(),
            cadastro.estado(),
            cadastro.semNumero()
        );
        return criar(c, encoder.encode(tokens.gerar()), true, identidade.sub());
    }

    @Transactional
    public void vincularGoogle(Usuario usuario, String credencial) {
        if (
            usuario.getPerfilEfetivo() != PerfilAcesso.CLIENTE
        ) throw new org.springframework.security.access.AccessDeniedException(
            "Google disponível para clientes"
        );
        var g = google.verificar(credencial);
        if (
            !usuario.isEmailVerificado() ||
            !g.email().equals(usuario.getEmail()) ||
            (usuario.getGoogleSub() != null && !usuario.getGoogleSub().equals(g.sub()))
        ) throw new ConflitoException("Use o Google do mesmo e-mail verificado da conta");
        usuario.setGoogleSub(g.sub());
    }

    public void validarSenha(String senha) {
        com.ravtec.delivery.security.PoliticaSenha.validarTamanho(senha, 12);
        if (
            !senha.matches(".*[A-Z].*") || !senha.matches(".*[a-z].*") || !senha.matches(".*\\d.*")
        ) throw new IllegalArgumentException("Use 12 caracteres, com maiúscula, minúscula e número");
    }
}
