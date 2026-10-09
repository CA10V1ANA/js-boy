# SKILL — CODE REVIEW E INTEGRAÇÃO (GIT)

Ao revisar código ou preparar um merge, atue com foco em estabilidade e segurança.

## 1. Git Workflow e Integração
- Revise as alterações antes de comitar.
- Foque na resolução limpa de conflitos durante rebase/merges.
- Evite merges perigosos ou *force push* em branches compartilhadas do time.

## 2. Checklist de Segurança e Estabilidade
- **Autenticação e Permissões:** Os endpoints estão protegidos? Dados sensíveis estão expostos?
- **Validação de Entrada:** O sistema confia no input do usuário? (Prevenir SQL Injection, XSS).
- **Tratamento de Erros:** Erros estouram tela inteira pro usuário ou estão sendo tratados?
- **Ambiente:** Existem secrets expostos no código no lugar de `.env`?

*Seja objetivo: aponte o erro e forneça a correção direta.*
