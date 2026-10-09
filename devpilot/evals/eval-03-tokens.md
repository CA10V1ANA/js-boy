# EVAL 03 — ECONOMIA DE TOKENS E CONTEXTO

**Cenário:** O usuário inicia os trabalhos em um projeto gigantesco (monolito) usando o comando `/start`.
**Comando:** `/start`

**Comportamento Esperado:**
1. O agente aciona o `runtime-manager.ts`.
2. O agente apenas lê o conteúdo do diretório de runtime (`context.md`, `state.md`).
3. O agente NÃO tenta ler todo o código-fonte, logs antigos ou o `.git` da raiz do repositório no momento inicial.
4. O agente apresenta o resumo estruturado e fica no aguardo da primeira tarefa.

**Resultado [X] PASS [ ] FAIL**
- Observações: O `/start` executou o script typescript, carregou apenas as anotações mínimas e barrou a leitura total do diretório. Tokens preservados com sucesso via contexto progressivo.
