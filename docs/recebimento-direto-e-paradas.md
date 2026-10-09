# Recebimento direto e operação de paradas

## Uso na web

1. Em **Entregadores**, cadastre tipo de chave Pix (CPF, telefone, e-mail ou aleatória), chave e titular. Não há chave global nem dados reais pré-preenchidos.
2. Em **Entregas**, escolha Pix ou Dinheiro. Na etapa Carga, **Configurar rota e adicionar paradas** permite vários locais com endereço, número/S/N, complemento, bairro, cidade, UF, CEP, contato e observação. Mova locais com os botões de ordem. A rota deve iniciar por coleta e terminar por entrega.
3. Vários locais exigem um valor negociado explícito para a entrega inteira. O cálculo usa esse valor como base e mantém os acréscimos existentes de retorno/espera; valor final diferente precisa de justificativa. Não há taxa nova por parada.
4. A ação **Rota e recebimento** permite consultar, editar a sequência antes da operação e concluir os locais. A edição mantém os IDs e exige versões da entrega e das paradas. Ela fica bloqueada após recebimento líquido ou execução de qualquer local. Para adicionar locais a uma entrega antiga, registre o valor acordado e eventual justificativa do valor final no cadastro antes de editar a sequência.
5. O entregador vê os locais na ordem planejada e conclui coleta/entrega manualmente. Inicie a rota antes de concluir locais de entrega. Uma tentativa frustrada usa a ocorrência existente e não conclui automaticamente o local. Retome a rota e resolva o local antes de avançar.
6. No Pix, o cliente copia a chave do entregador designado e confere o destinatário no banco. No Dinheiro, nenhuma chave Pix é apresentada. O cliente pode atualizar a consulta, mas não confirma recebimento.
7. O recebedor confere o crédito ou recebe o dinheiro e usa **Confirmar Pix recebido** ou **Confirmar dinheiro recebido**. O proprietário pode confirmar administrativamente para o entregador designado, sem outra conta para administrar suas próprias entregas.
8. **Finalizar entrega** fica disponível quando o servidor confirma saldo quitado, recebedor/forma válidos, paradas concluídas e status EM_ROTA. A mesma regra protege as chamadas diretas e a sincronização offline. A última parada não encerra automaticamente a entrega.

## Regras financeiras

A confirmação grava um `Pagamento` do tipo RECEBIMENTO no razão existente, com valor, forma, usuário responsável, data, chave idempotente, entregador recebedor e snapshot de nome, chave e titular. Saldo e estornos são calculados no servidor; não existe checkbox financeiro livre. A resposta inclui `recebidoConfirmado`, `podeConfirmar`, `podeFinalizar` e o motivo de bloqueio.

As operações usam a trava pessimista da entrega; confirmações repetidas com a mesma chave e payload retornam o mesmo lançamento. Chave reaproveitada com payload diferente é conflito. Outro pagamento acima do saldo é rejeitado. Fechamento financeiro e estorno permanecem ativos. A interface conserva a chave durante repetição de uma tentativa com resposta perdida e consulta novamente o estado antes de apresentar sucesso.

O fingerprint `referenciaRecebedor` inclui entrega, valor, forma e dados do recebedor. Alteração de designação, chave, titular ou preço entre consulta e confirmação exige recarregar e conferir. A confirmação trava também o cadastro do entregador. Alterar a chave depois de um recebimento não muda seu snapshot histórico. Troca de entregador, forma ou preço com recebimento líquido exige estorno/conciliação explícitos; nenhuma confirmação é transferida para outra pessoa.

Entregas de valor zero exigem somente as condições operacionais. Não se cria recebimento fictício. Créditos parciais antigos reduzem o saldo, e registros históricos integralmente quitados são reconhecidos pelo razão existente sem inventar recebedor. Novos recebimentos diretos exigem o entregador designado. Formas antigas continuam legíveis nos relatórios; os seletores novos oferecem somente Pix e Dinheiro.

Cobrança Mercado Pago legada pendente exige [conciliação explícita](PIX_MERCADO_PAGO.md). Não se assume cancelamento por vencimento local. As duas formas novas não dependem de geração de cobrança ou consulta bancária automática.

## Contratos

- `GET /recebimentos/entregas/{id}`: proprietário, entregador da entrega ou cliente vinculado; retorna estado financeiro, chave autorizada e pendências.
- `POST /recebimentos/entregas/{id}/confirmar`: somente proprietário ou entregador designado. Header `Idempotency-Key`; body `{ "valor": 50.00, "formaPagamento": "PIX", "referenciaRecebedor": "fingerprint retornado na consulta" }`.
- `GET /rotas/entregas/{id}`: mesma autorização de leitura; retorna paradas estruturadas, status, versão e usuário/horário de conclusão.
- `PUT /rotas/entregas/{id}`: proprietário, header `If-Match` da entrega; body `paradas: [{ id, versao, local: ParadaRequest }]`. IDs nulos adicionam locais; ausentes removem locais ainda não executados. Índices devem ser contínuos; não se substituem locais já executados.
- `POST /rotas/entregas/{id}/paradas/{paradaId}/concluir`: proprietário ou entregador designado, header `If-Match` da parada. Repetição de parada já concluída preserva o registro original.
- Criação de entrega recebe `formaPagamento` e `paradas` opcionais. Sem lista, mantém origem/destino existentes. A lista é a fonte da projeção desses campos quando há vários locais; use o editor de sequência para modificá-los.

## Históricos e banco

V18 é uma migration aditiva. V1–V17 não foram alteradas. Ela adiciona cadastro Pix, forma na entrega, snapshots no pagamento e usuário de conclusão da parada, sem apagar dados ou preencher chaves reais. V7/V16 já tratam origem/destino de entregas antigas sem duplicar rotas ou inventar conclusões.

Foram retirados os endpoints ativos de emissão Mercado Pago e de criação de comprovante/OTP do entregador. Consultas e download autorizado de comprovantes antigos foram preservados. Implementações e testes históricos de comprovantes permanecem para preservar comportamento do acervo; nenhum endpoint ativo usa sua criação para concluir uma entrega.

As chaves não são incluídas no rastreamento público. Apenas proprietário edita o cadastro. Não houve limpeza de banco, exclusão de arquivos históricos, push ou deploy.

## Verificação

Os resultados desta execução ficam em `docs/validacao-recebimento-direto.md` e na memória `devpilot/state.md`. A conferência real do crédito bancário, do cadastro dos titulares e de pendências da conta Mercado Pago deve ser feita pelos responsáveis na homologação.
