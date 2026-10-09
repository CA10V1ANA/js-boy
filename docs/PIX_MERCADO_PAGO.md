# Conciliação de cobranças Mercado Pago legadas

A emissão de novas cobranças Mercado Pago foi descontinuada. O fluxo atual é [Pix direto ou dinheiro](recebimento-direto-e-paradas.md). Não há geração de QR Code, Pix Copia e Cola ou polling do provedor na web.

O checkout não contém acesso ao banco de produção nem inventário confiável de cobranças reais pendentes. Por isso foram preservados a tabela `cobrancas_pix`, as migrations aplicadas, a consulta autorizada, o SDK para **consultar transações existentes** e o webhook com validação de assinatura. Nenhum registro foi cancelado ou considerado pago por suposição. Essa retenção é temporária e depende da conferência dos registros reais pelo operador.

## Resolver uma cobrança pendente

No painel do proprietário, abra **Rota e recebimento**. Se houver cobrança antiga pendente, informe o ID da transação existente na conta Mercado Pago e use **Consultar e conciliar cobrança antiga**. A API `POST /api/pix/{cobrancaId}/conciliar` aceita `{ "transacaoId": 123 }`, exige proprietário e consulta a transação no provedor. Ela verifica referência externa, ID, valor, moeda BRL e método Pix antes de atualizar a cobrança. Não emite outra cobrança.

Aprovação gera um único lançamento legado, respeitando o fechamento financeiro. Cancelamento ou rejeição confirmados pelo provedor liberam o recebimento manual do saldo. Estado pendente continua bloqueando recebimento manual naquela entrega. O vencimento local, sozinho, não confirma cancelamento. Se a cobrança não possui ID do provedor porque a resposta antiga foi perdida, localize a transação na conta Mercado Pago e informe seu ID; o sistema não recria a cobrança para recuperá-la.

Sem ID conhecido, credencial válida ou resposta conclusiva do provedor, a pendência continua aberta e precisa de conferência administrativa. Reembolso/chargeback continuam exigindo devolução no provedor e conciliação do financeiro; estorno manual de um lançamento Mercado Pago permanece bloqueado.

## Configuração somente para o legado

`MERCADOPAGO_ACCESS_TOKEN` permite consultar transações antigas; `MERCADOPAGO_WEBHOOK_SECRET` valida notificações antigas em `/api/webhooks/mercadopago`. Mantenha esses segredos somente no backend. `MERCADOPAGO_NOTIFICATION_URL` foi removida porque não há novas emissões.

O webhook preserva HMAC SHA-256 e consulta o provedor; um corpo arbitrário com `approved` não confirma recebimento. Eventos repetidos são serializados pela trava financeira da entrega. O Pix direto do entregador não depende dessas credenciais e não recebe confirmação automática do banco.

Após conciliar todas as pendências reais e verificar consumidores, pode-se retirar SDK, webhook e adaptador em uma mudança posterior. Preserve o histórico autorizado e as migrations já aplicadas. Os testes locais com SDK simulado não substituem a verificação da conta real.
