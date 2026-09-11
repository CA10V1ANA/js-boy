package com.ravtec.delivery.service;

import java.io.*;
import java.nio.file.*;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class ArmazenamentoLocalArquivo implements ArmazenamentoArquivo {
    private final Path raiz;

    public ArmazenamentoLocalArquivo(
        @Value("${app.storage.local-root:${java.io.tmpdir}/jsboy-uploads}") String raiz
    ) {
        this.raiz = Path.of(raiz).toAbsolutePath().normalize();
    }

    @Override
    public void salvar(String chave, byte[] conteudo) {
        Path temporario = null;
        try {
            Files.createDirectories(raiz);
            temporario = Files.createTempFile(raiz, ".staging-", ".tmp");
            Files.write(temporario, conteudo, StandardOpenOption.TRUNCATE_EXISTING);
            Files.move(temporario, resolver(chave), StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new IllegalStateException("Nao foi possivel armazenar o comprovante", e);
        } finally {
            if (temporario != null) {
                try {
                    Files.deleteIfExists(temporario);
                } catch (IOException ignored) {
                    // A reconciliacao remove qualquer staging residual.
                }
            }
        }
    }

    @Override
    public InputStream abrir(String chave) {
        try {
            return Files.newInputStream(resolver(chave));
        } catch (IOException e) {
            throw new IllegalStateException("Comprovante indisponivel", e);
        }
    }

    @Override
    public void excluir(String chave) {
        try {
            Files.deleteIfExists(resolver(chave));
        } catch (IOException e) {
            throw new IllegalStateException("Nao foi possivel excluir o comprovante", e);
        }
    }

    @Override
    public Set<String> listarChaves() {
        if (!Files.exists(raiz)) return Set.of();
        try (var arquivos = Files.list(raiz)) {
            return arquivos.filter(Files::isRegularFile)
                .filter(path -> !path.getFileName().toString().startsWith(".staging-"))
                .map(path -> path.getFileName().toString())
                .collect(Collectors.toUnmodifiableSet());
        } catch (IOException e) {
            throw new IllegalStateException("Nao foi possivel listar os comprovantes", e);
        }
    }

    @Override
    public boolean existe(String chave) {
        return Files.isRegularFile(resolver(chave));
    }

    private Path resolver(String chave) {
        Path alvo = raiz.resolve(chave).normalize();
        if (!alvo.startsWith(raiz)) throw new SecurityException("Chave de armazenamento invalida");
        return alvo;
    }
}
