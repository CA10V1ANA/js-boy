# Pix via Mercado Pago

## Configurar

1. Revogue credenciais divulgadas e gere novas no painel do Mercado Pago. Confirme o ambiente da conta e da credencial; não deduza o ambiente pelo prefixo do token.
2. No `.env` da raiz, preencha `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` (assinatura secreta de Webhooks) e `MERCADOPAGO_NOTIFICATION_URL=https://SEU_BACKEND/api/webhooks/mercadopago`.
3. Em Webhooks no painel, configure essa URL no ambiente correspondente e selecione o evento **Payments / payment**, pois esta implementação usa a Payments API com `PaymentClient`, não a Orders API.
4. Inicie com `docker compose up --build`. O Compose lê o `.env` e injeta as três variáveis no backend. Para executar diretamente pelo Maven/IDE, configure essas variáveis no ambiente do processo: Spring Boot não lê `.env` automaticamente. Em hospedagem, use as variáveis privadas do serviço backend.
5. Cadastre o e-mail do cliente e uma entrega com saldo positivo. O cliente da entrega, o entregador atribuído e o proprietário podem gerar/recuperar a cobrança em suas telas. O valor vem do saldo calculado no servidor.

Não use prefixo `VITE_` para segredos. Nenhuma credencial foi adicionada ao código. O webhook precisa ser acessível publicamente por HTTPS; `localhost` não recebe notificações do Mercado Pago.

## Fluxo

`POST /api/pix/entregas/{entregaId}` cria ou recupera a única cobrança vinculada à entrega. O DTO inclui `id`, `mercadoPagoId`, `valor`, `status`, `qrCodeBase64`, `qrCodeCopiaECola` e `expiraEm`.

`GET /api/pix/{id}` consulta o estado local com autorização pela entrega. A interface consulta a cada oito segundos enquanto pendente. Copiar usa `navigator.clipboard`; caso indisponível, o campo permite selecionar e copiar manualmente.

O webhook valida HMAC SHA-256 usando `x-signature`, `x-request-id` e o parâmetro de URL `data.id`. O ID do corpo deve coincidir. O backend busca o pagamento no Mercado Pago e confere referência externa, ID, moeda BRL, método Pix e valor antes de registrar aprovação. Falhas de consulta ou lançamento retornam erro para permitir reenvio. Eventos repetidos são serializados pela trava financeira da entrega e geram um único lançamento.

`cobrancas_pix` contém a intenção pendente; `pagamentos` continua contendo apenas lançamentos confirmados. A aprovação registra o recebimento e respeita o fechamento financeiro existente. Se o período estiver fechado, reabra-o pelo fluxo financeiro e reenvie a notificação no painel. Recarregue os relatórios para visualizar o novo lançamento.

## Validação no ambiente de teste

Use exclusivamente a configuração de testes indicada para sua conta na documentação do Mercado Pago. Gere uma cobrança, confira o QR Code e copie o código. Simule/realize a aprovação conforme as capacidades desse ambiente, confira o webhook e o status PAGO; reenvie o evento e verifique que existe somente um lançamento. Um POST arbitrário com `approved` no corpo não confirma pagamento.

Referências: [SDK Java oficial](https://github.com/mercadopago/sdk-java), [Webhooks](https://www.mercadopago.com.br/developers/en/docs/checkout-pro-preferences/additional-content/notifications/webhooks).

## Limites atuais

Uma cobrança por entrega, sem renovação automática de cobrança expirada/rejeitada. Não altere valor da entrega enquanto houver Pix pendente; o recebimento manual é bloqueado enquanto pendente. Esta implementação cobra do cliente para a conta configurada: repasse/saque para entregadores, split, cancelamento e reembolso remoto não fazem parte deste fluxo. O estorno financeiro manual é bloqueado para recebimentos Mercado Pago, pois não devolve dinheiro no provedor. Eventos posteriores de reembolso/chargeback precisam de conciliação própria. A validação local com SDK simulado não comprova operação real; a homologação depende de credenciais novas e webhook público configurado pelo titular.
