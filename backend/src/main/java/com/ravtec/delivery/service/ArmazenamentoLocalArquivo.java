package com.ravtec.delivery.service;

import java.io.*;
import java.nio.file.*;
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
        try {
            Files.createDirectories(raiz);
            Files.write(resolver(chave), conteudo, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new IllegalStateException("Nao foi possivel armazenar o comprovante", e);
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

    private Path resolver(String chave) {
        Path alvo = raiz.resolve(chave).normalize();
        if (!alvo.startsWith(raiz)) throw new SecurityException("Chave de armazenamento invalida");
        return alvo;
    }
}
