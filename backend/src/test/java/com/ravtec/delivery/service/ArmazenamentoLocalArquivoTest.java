package com.ravtec.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ArmazenamentoLocalArquivoTest {
    @TempDir Path diretorio;

    @Test
    void arquivoPermaneceDisponivelAposRecriarProvider() throws Exception {
        var primeiro = new ArmazenamentoLocalArquivo(diretorio.toString());
        primeiro.salvar("proof.pdf", "evidencia".getBytes());

        var depoisDoReinicio = new ArmazenamentoLocalArquivo(diretorio.toString());
        try (var input = depoisDoReinicio.abrir("proof.pdf")) {
            assertThat(input.readAllBytes()).isEqualTo("evidencia".getBytes());
        }
        assertThat(depoisDoReinicio.listarChaves()).containsExactly("proof.pdf");
        assertThat(depoisDoReinicio.existe("proof.pdf")).isTrue();
    }

    @Test
    void rejeitaChaveQueEscapaDaRaiz() {
        var storage = new ArmazenamentoLocalArquivo(diretorio.toString());
        assertThatThrownBy(() -> storage.salvar("../escape", new byte[] {1}))
            .isInstanceOf(SecurityException.class);
    }
}
