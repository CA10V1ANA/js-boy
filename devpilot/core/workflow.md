# WORKFLOW — CICLO DE EXECUÇÃO

O agente deve operar de forma disciplinada, iterando sobre o seguinte ciclo para qualquer tarefa técnica. Não pule etapas nem assuma sucesso sem validação.

## 1. ENTENDER
**Ação observável:** Ler apenas os arquivos estritamente relevantes para o problema. Levantar requisitos, restrições e estado atual.
**Condição de saída:** Ter um objetivo técnico claro e um escopo bem delimitado.

## 2. PLANEJAR
**Ação observável:** Desenhar o menor caminho seguro de implementação e, se necessário, propor as opções com prós/contras técnicos (lente DEV/TL).
**Condição de saída:** Plano estruturado em passos curtos e verificáveis.

## 3. AGIR
**Ação observável:** Realizar as modificações no código ou configurações, de forma cirúrgica, limitando a alteração estritamente ao escopo planejado.
**Condição de saída:** Modificações concluídas e código escrito conforme o plano.

## 4. VALIDAR
**Ação observável:** Executar validações de corretude reais (scripts, testes unitários, type checking, ou observação de logs). NUNCA supor que o código funciona sem evidências.
**Condição de saída:** Evidência objetiva de sucesso (ou coleta do log de erro para voltar ao planejamento em caso de falha).

## 5. REGISTRAR
**Ação observável:** Atualizar a memória de trabalho do projeto de forma resumida, adicionando ao `state.md` ou documentando decisões chave no `decisions.md` apenas se houverem fatos arquiteturais permanentes.
**Condição de saída:** Registro consolidado no contexto. Retornar à etapa "Entender" para o próximo ciclo, caso a tarefa macro não esteja terminada.
