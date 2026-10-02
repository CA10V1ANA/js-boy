# Correções incrementais — 11/09/2026

## Escopo

Correções locais dos bloqueios encontrados na entrega e na revisão de produção.
Não houve publicação, nova simulação mensal, envio de OTP real nem alteração de
registros na homologação nesta etapa. O mapa Graphify orientou a localização do
fluxo; as decisões foram confirmadas nos arquivos atuais.

## Alterações desta etapa

- Removida a colisão de versões Flyway: `V13__business_contact` permanece;
  `operational_growth` passa a `V15`. Não executar `repair` nem apagar histórico
  do Flyway para contornar divergências. Antes do deploy em uma base existente,
  confirmar qual V13 consta em `flyway_schema_history`.
- V16 adiciona coleta/destino somente em entregas ativas sem nenhuma parada.
  Preserva rotas parciais/personalizadas, cancelamentos e entregas concluídas.
  Não cria comprovante, OTP validado ou conclusão artificial.
- Validação do comprovante final passa a depender obrigatoriamente do repositório,
  eliminando a possibilidade de ignorar a verificação por dependência ausente.
- Mudanças de status e designação geram evento na outbox na mesma transação.
  O envio continua usando o provedor configurado; esta etapa não habilita
  notificações WhatsApp/SMS nem confirma entrega real pelo Resend.
- Alteração de situação do cliente realiza flush antes de montar a resposta,
  devolvendo a versão persistida.
- Lançamentos verificam fechamento tanto da competência quanto da data de caixa,
  convertida para o fuso de negócio. Repetições idempotentes já registradas são
  reconhecidas antes dessa validação.
- Fechamentos sobrepostos a um período ainda fechado são rejeitados.

## Validação

Resultados finais dos testes serão registrados ao terminar a execução local.
Somente classes afetadas e verificações de inicialização/migration estão no escopo.

## Limites para liberar produção

- Executar migrations e smoke na versão efetivamente publicada, incluindo uma
  entrega antiga sem paradas e uma nova entrega até comprovante validado.
- Verificar migrations/locks em PostgreSQL real; H2 não comprova concorrência
  entre réplicas nem performance do ambiente Railway.
- Confirmar Twilio/Resend com credenciais válidas e destinatários controlados,
  CORS com URLs finais, volume persistente e restauração de backup real.
- Paginação completa, storage compartilhado entre réplicas e migração de JWT
  para cookie não foram implementados nesta etapa. Não considerar a aplicação
  homologada para escala horizontal por causa destes testes locais.
- Não houve teste de carga novo nem evidência nova de um mês operacional
  completo. Não interpretar dados de simulação já existentes como essa garantia.
