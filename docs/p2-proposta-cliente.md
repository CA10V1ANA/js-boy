# P2 — Completar a proposta ao cliente

## Fronteiras de acesso

- `CLIENTE`: o vínculo é sempre obtido do `SecurityContext`; solicita entregas e consulta somente entregas, pagamentos, paradas, ocorrências e comprovantes próprios.
- `ENTREGADOR`: o vínculo é sempre obtido do `SecurityContext`; opera somente entregas designadas a ele.
- `PROPRIETARIO`: administra solicitações, links, recorrências e exceções.
- Rastreamento público usa token aleatório de 256 bits. Somente SHA-256 do token é persistido.

O rastreamento não retorna UUID interno, valores, documentos, telefones de destinatários, observações privadas nem localização em tempo real. Links podem expirar e ser revogados.

## Endpoints P2

### Cliente autenticado

- `POST /cliente/entregas`
- `GET /cliente/entregas/{id}/paradas`
- `GET /cliente/entregas/{id}/comprovantes`
- `GET /cliente/entregas/{id}/ocorrencias`
- `GET|PUT /cliente/notificacoes/preferencias`

Toda solicitação do cliente entra em `SOLICITADA`; cliente não envia `clienteId`, valor, status ou entregador.

### Operação do entregador

- `GET /operacao-entregador/entregas/{id}/paradas`
- `POST /operacao-entregador/entregas/{id}/paradas/{paradaId}/concluir`
- `POST /operacao-entregador/entregas/{id}/comprovantes`
- `POST /operacao-entregador/entregas/{id}/ocorrencias`
- `POST /operacao-entregador/offline/entregas/{id}/status`

Uploads e sincronizações exigem `Idempotency-Key`. Paradas anteriores pendentes impedem concluir uma parada futura.

### Proprietário e público

- `POST /entregas/{id}/rastreamentos?expiraEm=...`
- `DELETE /entregas/{id}/rastreamentos/{linkId}`
- `GET /public/rastreamento/{token}`
- `POST /recorrencias`
- `POST /recorrencias/gerar?ate=AAAA-MM-DD`
- `PATCH /recorrencias/{id}/ativa?ativa=false`
- `GET /comprovantes/{entregaId}/{comprovanteId}/arquivo` (autenticado e autorizado)

## Máquina de estados

Fluxo principal:

`SOLICITADA → CONFIRMADA/AGENDADA → AGUARDANDO_ENTREGADOR → ENTREGADOR_DESIGNADO → COLETADA → EM_ROTA → ENTREGUE`

Exceções:

- `EM_ROTA → TENTATIVA_FALHOU → EM_ROTA | EM_DEVOLUCAO | FALHA_OPERACIONAL`
- `COLETADA | EM_ROTA → EM_DEVOLUCAO → DEVOLVIDA`
- `ENTREGADOR_DESIGNADO | COLETADA | EM_ROTA → FALHA_OPERACIONAL`

`ENTREGUE`, `DEVOLVIDA`, `FALHA_OPERACIONAL` e `CANCELADA` são terminais. A conclusão em `ENTREGUE` exige comprovante de entrega.

## Uploads

- Tipos aceitos: JPEG, PNG e PDF, confirmados por conteúdo.
- Limite padrão: 5 MiB.
- JPEG/PNG são decodificados e regravados, removendo metadados não necessários.
- Nomes são UUIDs aleatórios; arquivos não são gravados no repositório.
- O provedor local usa diretório temporário apenas em desenvolvimento.
- Produção deve fornecer implementação de `ArmazenamentoArquivo` para objeto privado (S3 compatível, Blob etc.).
- Downloads passam por autorização e usam `Cache-Control: no-store`; não há URL pública previsível.

Retenção recomendada: definir prazo jurídico/contratual; ao expirar, excluir o objeto e anonimizar/remover o registro conforme a política LGPD. Não executar limpeza sem política aprovada.

## Notificações

A outbox é transacional, idempotente e tem tentativas com backoff. O provedor `local` apenas registra metadados não sensíveis no log. Um provedor real deve implementar `NotificacaoProvider`; nenhuma credencial ou fornecedor está fixado.

Eventos iniciais suportados pela arquitetura: solicitação recebida, confirmação, designação, coleta, rota, conclusão, falha, devolução e pagamento.

## Offline Flutter

- Cache de entregas e filas ficam no Keystore/Keychain via `flutter_secure_storage`.
- Ações de status usam chave idempotente persistida no backend.
- Fotos capturadas são copiadas para diretório privado do aplicativo e removidas somente após confirmação do servidor.
- A interface mostra modo offline e quantidade pendente.
- Conflito HTTP 409 mantém a ação na fila para revisão; não força sobrescrita.

O provedor de mapas é escolhido por `--dart-define=MAPS_PROVIDER=google|apple|osm`. O app abre rota externa e não apresenta ETA ou localização em tempo real.

## Configuração

```text
APP_STORAGE_PROVIDER=local
APP_STORAGE_LOCAL_ROOT=<diretorio fora do repositorio>
APP_STORAGE_MAX_FILE_BYTES=5242880
APP_PROOF_PHOTO_REQUIRED=false
APP_NOTIFICATIONS_PROVIDER=local
APP_NOTIFICATIONS_POLL_MS=30000
APP_TRACKING_RATE_LIMIT_MAX_REQUESTS=30
APP_TRACKING_RATE_LIMIT_WINDOW_MINUTES=5
```

As propriedades Spring equivalentes são `app.storage.*`, `app.proof.*`, `app.notifications.*` e `app.tracking.*`. Para Flutter, use `API_URL` e `MAPS_PROVIDER` via `--dart-define`.
