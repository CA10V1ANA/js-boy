# Diagnóstico — JS Boy

Base: main no commit `1e121184055a4c41e275b4ff5919bf56ce2870ff`. Leitura dirigida, sem execução do ambiente. O projeto não deve ser tratado como CRUD recém-iniciado.

## O que já está presente

| Evidência | Consequência para a mentoria |
|---|---|
| backend/pom.xml: Java 21 e Spring Boot 3.3.6; frontend/package.json: React 18.3.1 declarado, TypeScript e Vite | Preservar a stack; não transportar Angular/NestJS dos exercícios |
| EntregaController restringe operações por papel; EntregaService busca entrega pelo vínculo do entregador | Estudar autorização existente e validar pela API; não “adicionar login” como se não houvesse |
| EntregaStatusPolicy define transições e destinos permitidos ao entregador | Mapear a máquina de estados real; não inventar sequência simplificada incompatível |
| EntregaService valida cliente/entregador, preço, justificativa de ajuste, histórico e comprovante final | A criação e conclusão de entrega atravessam regras reais, boas candidatas a estudo |
| PagamentoService tem idempotência, hash do payload, limites de saldo e estorno | Validar e compreender, em vez de recriar financeiro |
| EntregaServiceTest já cobre criação, vínculo e bloqueio de conclusão sem comprovante | Reutilizar testes; existência do teste não comprova que a suíte passa |
| README identifica mobile/ como canônico e informa duplicação temporária na raiz | Não editar a cópia Flutter errada nem apagar duplicatas por impulso |

## Pontos para investigar, sem afirmar bug reproduzido

1. **Carregamento parcial:** EntregasPage.carregarBase usa Promise.all; carregarEntregas captura erro, mas outras cargas lidas propagam rejeição. Verificar o que o usuário vê se apenas clientes ou tabela de preços falhar.
2. **Feedback duplicado:** interceptor de api.ts emite toast; ações de EntregasPage também exibem mensagens no catch. Reproduzir antes de escolher uma única responsabilidade de feedback.
3. **Envio repetido:** finalizarWizard faz POST/PUT. Avaliar botão, estado pendente e comportamento de clique duplo no arquivo completo. Não foi comprovada duplicação de registros nesta análise.
4. **Opções de status:** a lista administrativa tem um subconjunto de estados e não representa sozinha a política do backend. Verificar opções exibidas para cada estado e a mensagem de rejeição.
5. **Conflito de edição:** a tela envia If-Match; VersionamentoService somente compara quando o valor não é nulo. Diferenciar conflito detectável com versão enviada de contrato que exige versão em toda mutação. Não concluir que existe falha geral de concorrência sem verificar entidade, transação e requisições simultâneas.
6. **Compatibilidade de ferramentas:** frontend/package.json declara Node >=18 e Vite ^8.1.5. Conferir engines do lockfile/dependências e CI antes de escolher o Node; não tratar o mínimo declarado como compatibilidade comprovada.

## Prioridade recomendada

Primeiro, uma entrega demonstrável com autorização, preço e status corretos. Depois, feedback de erro e concorrência da operação escolhida. Em seguida, validar recebimento/estorno. Mobile e offline entram como trilha própria após a API estar compreendida. Capacidades existentes ficam preservadas durante essa priorização.

## Fontes do snapshot

Prefixo:
https://github.com/CA10V1ANA/js-boy/blob/1e121184055a4c41e275b4ff5919bf56ce2870ff/

- README.md; backend/pom.xml; frontend/package.json
- frontend/src/pages/EntregasPage.tsx
- frontend/src/services/api.ts
- backend/src/main/java/com/ravtec/delivery/controller/EntregaController.java
- backend/src/main/java/com/ravtec/delivery/dto/EntregaRequest.java
- backend/src/main/java/com/ravtec/delivery/service/EntregaService.java
- backend/src/main/java/com/ravtec/delivery/service/EntregaAcessoService.java
- backend/src/main/java/com/ravtec/delivery/service/EntregaStatusPolicy.java
- backend/src/main/java/com/ravtec/delivery/service/VersionamentoService.java
- backend/src/main/java/com/ravtec/delivery/service/PagamentoService.java
- backend/src/test/java/com/ravtec/delivery/service/EntregaServiceTest.java

Não foram executados testes de integração, banco, interface, Flutter ou deploy. Autorização e idempotência presentes no código não equivalem a segurança/consistência homologadas.
