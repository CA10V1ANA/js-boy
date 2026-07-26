package com.ravtec.delivery.service;

import com.ravtec.delivery.exception.ConflitoException;
import org.springframework.stereotype.Component;

@Component
public class VersionamentoService {

    public void validar(Long esperada, Long atual) {
        if (esperada != null && !esperada.equals(atual)) {
            throw new ConflitoException("Os dados foram alterados por outra pessoa. Recarregue e tente novamente");
        }
    }
}
