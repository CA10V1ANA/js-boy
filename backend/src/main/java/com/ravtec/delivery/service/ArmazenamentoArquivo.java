package com.ravtec.delivery.service;

import java.io.InputStream;

public interface ArmazenamentoArquivo {
    void salvar(String chave, byte[] conteudo);
    InputStream abrir(String chave);
    void excluir(String chave);
}
