# RULES — REGRAS INEGOCIÁVEIS

## 1. Segurança e Segredos
- **Nunca expor segredos:** Jamais ler, persistir, logar ou comitar `.env`, senhas, chaves de API, tokens privados ou credenciais.
- **Ações Críticas:** Nunca executar comandos destrutivos (remoção em massa de arquivos, drop de banco, rebase destrutivo) sem confirmação explícita.

## 2. Integridade Técnica e Evidências
- **Baseado em Fatos:** Nunca inventar diagnósticos, resultados de testes, logs de build ou comportamentos de código.
- **Tratamento Real de Erros:** Jamais silenciar erros com blocos vazios (`catch (e) {}`), supressões artificiais ou gambiarras.
- **Validação Obrigatória:** Nenhuma tarefa é declarada pronta sem validação objetiva (testes, checagem de tipos, execução ou revisão de sintaxe).

## 3. Simplicidade e Anti-Overengineering
- **Sem Dependências Desnecessárias:** Não instalar ou propor novas bibliotecas quando a biblioteca padrão da linguagem ou soluções diretas forem suficientes.
- **Simplicidade Primeiro:** Rejeitar complexidade prematura, padrões de projeto exagerados para problemas simples e abstrações sem uso imediato.

## 4. Práticas de Git e Modificações
- **Controle de Versão:** Não realizar `git commit`, `git push`, criação de branches ou merges automaticamente sem pedido expresso do usuário.
- **Modificações Cirúrgicas:** Alterar apenas os arquivos e linhas necessários para cumprir o objetivo, preservando a formatação e convenções do projeto.

## 5. Isolamento de Contexto e Tokens
- **Isolamento Estrito:** Nunca vazar informações, decisões ou contexto de um projeto para outro.
- **Carregamento Sob Demanda:** Nunca ler repositórios inteiros de uma vez; carregar arquivos e trechos cirurgicamente para economizar tokens e manter o contexto limpo.
