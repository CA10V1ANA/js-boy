# Desafio — dominar e consolidar a operação do JS Boy

## Missão

Demonstrar uma entrega de teste desde a criação até conclusão e registro financeiro, explicando regras e falhas. O sistema serve a uma empresa real: aprenda em dados fictícios e ambiente local/homologação controlada. Não reforme todos os módulos de uma vez.

O roteiro é incremental. Recursos que já funcionam precisam ser demonstrados, não recriados. Registrar pendências não significa que o código esteja defeituoso.

## J0 — Baseline e fronteira do primeiro ciclo

**Aprender:** separar UI, API, persistência, ambiente e regra de negócio.

**Passos:** conferir branch/diff; ler README, manifests e instruções locais. Escolher execução Docker ou desenvolvimento local existente. Conferir versões reais e variáveis sem colar segredos no chat. Usar banco de teste, com proprietário, dois entregadores e dois clientes fictícios.

**Baseline sugerido:** frontend `npm ci`, `npm test`, `npm run build`; backend `mvn test` com perfil de teste confirmado. Se o projeto requer outras opções, usar as documentadas e registrar. PostgreSQL da homologação pode comportar-se diferente de H2; não confundir os resultados. Não apagar volumes para “resolver” setup.

**Conversa de produto proposta para Caio ter com o pai:** quais dados recebe ao registrar um pedido? Como calcula preço? Quem designa e confirma entrega? Como registra pagamento parcial, cancelamento e comprovante? Não enviar mensagens automaticamente. Registrar respostas futuras como requisitos relatados, distintas do comportamento já codificado.

**Aceite:** ambiente reproduzível; usuários de teste; status dos comandos; uma entrega escolhida como fio condutor.

**Checkpoint:** “Qual parte do sistema é a autoridade para definir o valor e permitir uma ação?”

## J1 — Rastrear a criação de entrega, sem refatorar primeiro

**Arquivos de entrada:** EntregasPage.tsx, services/api.ts, EntregaController.java, EntregaRequest.java e EntregaService.java. Localizar mapper, entidade e repositório ao chegar à persistência.

**Aprender:** formulário contém texto; payload transforma dados; DTO valida; service aplica regra; transação persiste; response atualiza tela.

**Exercício, uma unidade por vez:**
1. Identificar finalizarWizard e quais campos são convertidos.
2. Prever o body para uma entrega fictícia e comparar com Network.
3. Localizar POST /entregas e o @Valid. Inspecionar status real; não presumir 201 apenas por ser POST.
4. Rastrear preencher/criar: cliente ativo, preço calculado, valor final, entregador opcional e histórico.
5. Ler mapper/response e conferir a lista após o save e após reload.
6. Enviar um caso inválido controlado e explicar em qual camada é rejeitado.

**Aceite:** entrega persiste e reaparece; dado inválido é recusado sem escrita parcial; Caio aponta o arquivo responsável por cada trecho do fluxo.

**Checkpoint:** “Por que validar no React não elimina a validação do backend?”

**Primeira contribuição pequena:** escolher uma falha de feedback reproduzida desse fluxo. Explicar e corrigir apenas ela; não extrair a página inteira neste momento.

## J2 — Fluxo operacional e autorização por vínculo

**Aprender:** autenticação identifica; papel permite classe de ação; vínculo delimita o recurso; regra de status controla a transição.

**Exercício:** ler EntregaStatusPolicy e construir uma tabela atual → destinos. Escolher o caminho de teste criando entrega já com entregador: ENTREGADOR_DESIGNADO → COLETADA → EM_ROTA → ENTREGUE. Conferir a exigência de comprovante final verificado antes de concluir. Localizar o fluxo real de comprovante; não desabilitar a regra para passar.

Separadamente, testar criação sem entregador: SOLICITADA; seguir as transições reais antes da designação. Não presumir que SOLICITADA pode ir direto para qualquer estado.

**Cenários de autorização:** entregador A consulta e altera sua entrega; B não acessa a mesma entrega pelo endpoint operacional; cliente A não consulta recursos de B pelos endpoints do portal; proprietário usa a rota administrativa. Fazer requests em ambiente de teste, não apenas ocultar botões.

**Aceite:** caminho válido e bloqueios relevantes demonstrados; falha não cria histórico falso; contrato de 403/404 registrado conforme handler real. Reutilizar EntregaServiceTest e EntregaStatusPolicyTest antes de ampliar cobertura.

**Checkpoint:** “Por que testar um service com mock não prova sozinho a autorização HTTP?”

## J3 — Feedback e concorrência na interface

**Aprender:** estado pendente, falha parcial, dono do feedback, versão desatualizada.

**Unidade A:** reproduzir falha somente em clientes ou tabela de preço ao abrir a tela. Definir o que fica bloqueado e o que pode continuar; tornar o erro recuperável sem apresentar dados inexistentes.

**Unidade B:** provocar um erro de save e observar toasts do interceptor e da página. Se duplicados, escolher responsabilidades para erro global e específico. Preservar o formulário e restaurar o botão após sucesso/falha. Avaliar clique duplo com request em andamento.

**Unidade C:** abrir a mesma entrega em duas abas; alterar na primeira; tentar editar com a versão antiga na segunda. Observar If-Match, handler e resposta. A UI deve informar conflito e permitir recarregar sem sobrescrever silenciosamente. Não generalizar essa evidência para todas as operações concorrentes.

**Aceite:** mensagem útil única para o cenário tratado; campos preservados; pending termina em qualquer resultado; conflito é distinguido de indisponibilidade. Extrair função/hook/componente apenas se isso resolver responsabilidade concreta e mantiver o comportamento.

**Checkpoint:** “Desabilitar um botão evita todos os casos de duplicidade no servidor?”

## J4 — Preço explicável para o negócio

**Aprender:** entrada, regra calculada, arredondamento e justificativa de intervenção manual.

**Exercício:** escolher casos da tabela real confirmada com o pai: bairro, tipo de veículo, espera, retorno e valor negociado quando exigido. Ler TabelaPrecoService e testes antes de propor alteração; esses arquivos não foram auditados neste pacote. Comparar prévia da UI com resultado autoritativo da API.

O service observado usa BigDecimal e exige justificativa quando valorFinal difere do calculado. Criar um caso com diferença e justificativa ausente; outro válido com motivo. Não trocar a regra por taxa/km apenas porque é mais fácil.

**Aceite:** uma tabela de exemplos com esperado definido pela regra e obtido pela API; frontend explica diferença quando houver; entradas inválidas não são aceitas silenciosamente.

**Checkpoint:** “Quais valores o cliente informa e quais o servidor precisa recalcular?”

## J5 — Recebimento e estorno sem duplicação

**Aprender:** idempotência, transação, saldo, estorno e concorrência.

**Antes:** ler PagamentoController, DTOs, repositórios e PagamentoServiceTest; confirmar headers/status pelo código e execução. Este pacote leu PagamentoService, não homologou a operação.

**Exercício com dados fictícios:** registrar recebimento parcial; repetir mesma chave e payload; repetir mesma chave com payload diferente; tentar ultrapassar saldo; estornar parcialmente; tentar ultrapassar valor disponível do recebimento; consultar o saldo resultante.

Exemplo de raciocínio, não resultado observado: entrega de R$ 30, recebimento de R$ 10, repetição idempotente mantém R$ 10 recebidos; estorno de R$ 4 deixa R$ 6 líquidos. Conferir definições do relatório e arredondamento reais.

**Aceite:** repetição válida não cria outro lançamento; chave reutilizada com outro conteúdo é rejeitada; saldo bate com histórico; estorno não apaga o original. Para validar concorrência real, usar teste de integração com PostgreSQL e operações simultâneas — mocks não provam locks/constraints.

**Checkpoint:** “Por que a chave deve continuar a mesma ao repetir uma operação cujo resultado não chegou ao cliente?”

## J6 — Ensaio de um turno com o proprietário

Montar um cenário curto: entrega comum, cancelamento antes da coleta, tentativa falha conforme política e pagamento parcial. Executar com contas e dados de teste. Observar onde o usuário hesita, quais termos não entende e se encontra as ações certas.

Registrar problema observado → impacto → melhoria pequena. Só então priorizar mudança de tela. Preservar identidade preta/amarela onde já aplicada; cor não substitui texto de status.

**Aceite:** principais fluxos têm evidência; proprietário consegue revisar um cenário; pendências separadas por bloqueador da operação, melhoria e extra; documentação não promete homologação que não ocorreu.

## J7 — Mobile e offline, trilha posterior

Confirmar mobile/ e comparar contrato com a API validada. Começar por login e leitura das entregas vinculadas; depois transição online; só então fila offline.

Cenários futuros: perder rede antes/depois do envio, reenviar a mesma operação, versão antiga, entrega redesignada enquanto offline, sessão expirada. O servidor deve continuar validando vínculo/status; a fila não concede permissão. Estados locais pendente/sincronizado/falhou devem ser visíveis.

**Aceite:** operação online demonstrada antes da offline; replay não duplica efeito segundo contrato real; conflito é apresentado sem sucesso fictício. Flutter analyze/test e execução no dispositivo precisam ser registrados; não constam como executados neste pacote.
