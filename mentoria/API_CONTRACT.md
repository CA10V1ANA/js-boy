# Contrato observado — JS Boy

Fonte: EntregaController e DTO/service no snapshot do diagnóstico. Caminhos abaixo são mappings do controller; confirmar base URL/context path no ambiente.

| Método | Caminho | Papel declarado | Entrada observada |
|---|---|---|---|
| GET | /entregas | PROPRIETARIO | Query opcional busca |
| GET | /entregas/{id} | PROPRIETARIO | UUID |
| POST | /entregas | PROPRIETARIO | EntregaRequest com @Valid |
| PUT | /entregas/{id} | PROPRIETARIO | EntregaRequest; If-Match opcional Long |
| PATCH | /entregas/{id}/status | PROPRIETARIO | EntregaStatusRequest; If-Match |
| PATCH | /entregas/{id}/entregador | PROPRIETARIO | DesignarEntregadorRequest; If-Match |
| GET | /entregas/minhas-entregas | ENTREGADOR | Vínculo verificado no service |
| GET | /entregas/minhas-entregas/{id} | ENTREGADOR | UUID e vínculo |
| PATCH | /entregas/minhas-entregas/{id}/status | ENTREGADOR | Status, If-Match e vínculo |

Não há status explícito de criação no método POST lido. Inspecionar comportamento global e observar resposta antes de documentar 200/201. Ler handlers antes de fixar 400/403/404/409 no contrato final.

## Criação: campos do EntregaRequest lido

Obrigatórios por anotações: clienteId; enderecoOrigem; bairroOrigem; enderecoDestino; bairroDestino; destinatarioNome; destinatarioTelefone; descricaoMercadoria; distanciaKm (não negativa).

Outros campos: entregadorId, observacoes, valorFinal (não negativo se informado), observacaoValorManual, tipoVeiculo, tempoEsperaMinutos (não negativo), possuiRetorno, valorNegociado (não negativo).

Obrigatoriedade de negócio pode ser condicional e mais forte que anotações: valor negociado para área que exige negociação, justificativa ao alterar manualmente o valor, cliente ativo e entregador ativo. Conferir serviço de preços para demais condições.

Respostas administrativas usam EntregaResponse; operacionais usam EntregaOperacionalResponse. Não presumir que o entregador deve receber todos os campos financeiros da resposta administrativa. Ler DTOs/mappers antes de alterar frontend.

## Cabeçalho de versão

A página administrativa envia If-Match com versao. O controller aceita header ausente e VersionamentoService só compara valor não nulo. Registrar comportamento real com e sem header e entender a política antes de torná-lo obrigatório. Compatibilidade com mobile também precisa ser considerada.

## Financeiro

PagamentoService recebe chave de idempotência e request, compara hash do payload e retorna lançamento existente em repetição compatível. Confirmar método/path/header no controller antes de chamar; nenhum endpoint financeiro foi inventado neste documento.

## Ficha para validar uma operação

Ambiente e commit:
Papel e vínculo do usuário fictício:
Método/path/query:
Headers sanitizados:
Body fictício:
Status/body esperado segundo código/regra:
Status/body observado:
Efeito persistido:
Atualização na interface:
Cenário de falha:
Evidência:

Não anexar tokens, senhas nem dados reais de destinatários.
