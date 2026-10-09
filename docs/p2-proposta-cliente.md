# Proposta ao cliente e operação atual

Revisado em 08/10/2026. Escopo desta publicação: web React + API Spring, Pix direto/dinheiro, paradas manuais e financeiro autorizado. Veja [explicação completa](explicacao-completa-do-projeto.md).

## Acessos

Cliente solicita e acompanha apenas seus serviços. Entregador executa suas entregas e confere recebimentos próprios. Proprietário define preço, designação, rota e exceções. Vínculos vêm da conta autenticada; UUID enviado não prova autorização.

Solicitação de cliente entra SOLICITADA. O cliente não escolhe valor, outro cliente, status ou entregador. Orçamento negociado pendente exige definição explícita antes da aprovação; zero não equivale a aprovação gratuita automática.

## Contratos ativos

Caminhos são relativos à raiz da API; não acrescentar um prefixo `/api` geral.

| Contrato | Perfil e regra |
| --- | --- |
| `POST /cliente/entregas` | Cliente vinculado; cria solicitação |
| `GET /cliente/entregas/{id}/paradas` e `/ocorrencias` | Cliente próprio |
| `GET /recebimentos/entregas/{id}` | Proprietário, entregador próprio ou cliente próprio |
| `POST /recebimentos/entregas/{id}/confirmar` | Proprietário ou entregador próprio; Idempotency-Key e referência atual do recebedor |
| `GET /rotas/entregas/{id}` | Proprietário ou vínculo próprio |
| `PUT /rotas/entregas/{id}` | Proprietário, versão atual e condições de edição |
| `POST /rotas/entregas/{id}/paradas/{paradaId}/concluir` | Proprietário ou entregador próprio; versão da parada e ordem |
| `POST /operacao-entregador/entregas/{id}/ocorrencias` | Entregador próprio; não reabre parada concluída |
| `POST /operacao-entregador/offline/entregas/{id}/status` | Sincronização idempotente autorizada; mesmas condições de domínio |
| `GET|PUT /cliente/notificacoes/preferencias` | Preferências próprias |
| `POST /entregas/{id}/rastreamentos` e `DELETE /entregas/{id}/rastreamentos/{linkId}` | Proprietário cria/revoga links |
| `GET /public/rastreamento/{token}` | Público, token limitado, sem dados financeiros ou GPS |
| `POST /recorrencias`, `POST /recorrencias/gerar`, `PATCH /recorrencias/{id}/ativa` | Administração da recorrência |

Fluxo principal: SOLICITADA → CONFIRMADA/AGENDADA → AGUARDANDO_ENTREGADOR → ENTREGADOR_DESIGNADO → COLETADA → EM_ROTA → ENTREGUE, com atalhos permitidos apenas pela máquina de estados. Há tentativa frustrada, devolução, falha definitiva e cancelamento anterior à coleta.

ENTREGUE exige todas as paradas concluídas e saldo regular, além de estado e entregador válidos. Valor zero explícito não exige recebimento fictício. Confirmação Pix é manual após conferir o banco; dinheiro após conferir o valor em mãos. Cliente não confirma, e copiar a chave não registra crédito. Estornos e tentativas repetidas usam o razão/idempotência existente.

## Acervo e integrações

Foto, assinatura, upload e OTP não fazem parte das exigências atuais. Listagem/download autorizado de comprovantes antigos permanecem para o acervo; `GET /comprovantes/{entregaId}/{comprovanteId}/arquivo` não torna o objeto público. Bucket Supabase privado via S3, acessado somente pela API. Não há nova emissão Mercado Pago; consulta/webhook preservados para conciliação legada.

Notificações usam outbox transacional, retentativas e Resend quando configurado. O provedor local é apenas desenvolvimento, não envio real. A web precisa de conexão para confirmar ações. A existência de endpoint de sincronização não significa que esta entrega tenha aplicativo Flutter ou fila offline completa.

Rastreamento usa token aleatório com hash no banco, expiração/revogação, timeline e contato da empresa. Não fornece localização do entregador em tempo real, Pix, valores ou documentos do destinatário.

## Configuração e validação

A configuração autoritativa está em [publicação Vercel/Railway/Supabase](publicacao-vercel-railway-supabase.md). Modelos locais/provedores não contêm credenciais. Retenção, conciliação física dos créditos e recuperação de acervo precisam de procedimento operacional da JS Boy. Testar três perfis, saldo/paradas, dinheiro, Pix, resposta perdida e restauração antes de liberar produção.
