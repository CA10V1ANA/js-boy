package com.ravtec.delivery.service;

import java.io.InputStream;
import java.util.Set;

public interface ArmazenamentoArquivo {
    void salvar(String chave, byte[] conteudo);
    InputStream abrir(String chave);
    void excluir(String chave);
    Set<String> listarChaves();
    boolean existe(String chave);
}
