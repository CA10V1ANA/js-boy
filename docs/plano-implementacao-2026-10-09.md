# Implementação do plano JS BOY — 09/10/2026

Implementação local do documento `JS_BOY_PLANO_IMPLEMENTACAO_CODEX.md`, usando as
capturas fornecidas como referências visuais. Trabalho na `main`, sem publicação
ou alterações manuais em dados reais. As capturas deste relatório usam uma API
de demonstração local e dados fictícios; não comprovam funcionamento em produção.

## Base aproveitada

Foram mantidos React/TypeScript, Java 21/Spring Boot, PostgreSQL e Flyway. A
implementação reutiliza autenticação e renovação de sessão, autorização por
vínculo, serviços de entrega, máquina de estados, rotas, locks, controle de
versão, recebimento direto, estorno, razão financeiro, auditoria, notificações
por outbox, recuperação de senha e fluxo de privacidade existentes.

Migrations aplicadas e provas históricas não foram reescritas. As mudanças locais
de armazenamento e do entrypoint existentes antes desta tarefa foram preservadas
e excluídas dos commits. O estado inicial do frontend foi salvo em um patch local
temporário antes da integração do novo plano.

## Funções entregues

- Proprietário vincula a própria conta a um entregador, alterna de área na mesma
  sessão e usa endpoints operacionais restritos às próprias atribuições.
  Desativar o vínculo mantém a conta administrativa.
- Portais com seis itens para entregador e sete para cliente; proprietário ganha
  Conversas e Notificações, preservando administração. Ajuda usa contato da empresa.
  Rotas, busca e seleção de entrega/conversa ficam na URL. O menu móvel fecha ao navegar.
- Resumo operacional, próxima entrega/parada, histórico em Minhas entregas,
  filtros e lista compacta com detalhes expansíveis. Perfil altera telefone e
  senha, sem permitir edição de atividade, vínculos ou comissão.
- Cliente solicita, acompanha, consulta pagamentos, mantém endereços frequentes,
  repete uma entrega para nova revisão e edita/cancela quando o estado permite.
  A conta reúne contato, preferências, segurança e privacidade, sem abas duplicadas.
- Cadastro público exclusivamente de cliente, e-mail confirmado por token com
  hash, uso único e validade de 24 horas. Convite interno usa definição de senha
  de uso único; não distribui senha inicial ao proprietário.
- Integração Google exclusiva de cliente, com validação de token no servidor e
  vínculo explícito em sessão autenticada. Sem client ID, a tela informa a ausência
  da configuração. Não foram criadas contas ou credenciais externas.
- Dinheiro aparece primeiro; Pix permanece direto ao entregador designado.
  Recebimento manual, saldo, ordem das paradas e finalização usam os serviços
  existentes. Foto, OTP e documentação não são exigidos no fluxo operacional.
  O cliente tem acompanhamento de leitura, sem controles para receber/finalizar.
- Conversa única por entrega, texto e eventos do sistema, participantes atuais,
  paginação, leitura individual, reenvio idempotente e reabertura administrativa.
- Central interna de notificações com leitura independente do e-mail/outbox.
  Eventos de negócio e mensagens são vinculados à transação; destinatários são
  deduplicados. Chat gera aviso agregado por conversa, sem e-mail por mensagem.
- Exportação de dados inclui endereços e mensagens de autoria do cliente.
  Anonimização administrativa limpa os novos dados pessoais e preserva sequência,
  histórico operacional e lançamentos financeiros.

O faturamento operacional mostra **valor movimentado**, sem apresentá-lo como
comissão ou remuneração calculada. Não foi introduzida uma regra de comissão nova.

## Regras das conversas

Uma conversa pertence a uma entrega. Cliente acessa apenas suas entregas;
entregador apenas designações atuais com vínculo ativo; proprietário pode consultar
todas na administração e somente as próprias no operacional. A autorização é
revalidada em cada leitura/envio, inclusive após troca ou desativação do responsável.

O banco possui unicidade por entrega e por identificador de envio do autor;
locks e sequência persistida ordenam os envios concorrentes. O navegador conserva
texto e UUID do envio pendente na sessão até confirmação. Mensagens são texto
escapado, sem HTML, mídia, IA, anexos, grupos livres ou poderes operacionais.

| Regra | Implementação padrão |
|---|---|
| Mensagem | Texto não vazio, até 2.000 caracteres; configuração pode reduzir esse teto |
| Frequência | 20 novos envios por minuto, por usuário/conversa |
| Histórico | 60 mensagens por consulta, cursor por sequência |
| Caixa de entrada | 30 conversas por página |
| Leitura | Cursor individual monotônico; não afirma que todos leram |
| Conclusão | Envio até 48 horas após conclusão, configurável |
| Cancelamento | Fecha envio imediatamente |
| Reabertura | Somente proprietário administrativo, motivo e prazo futuro até sete dias, auditada |
| Atualização | Polling a cada oito segundos, com aba visível, sem sobreposição no mesmo painel |
| Badges | Consulta a cada 30 segundos, com aba visível |
| Revogação | Próxima consulta perde acesso; a tela limpa histórico ao receber 401/403/404 |
| Retenção | Histórico sem exclusão automática por idade; anonimização pelo fluxo existente |

Polling é o transporte desta primeira etapa. Não mantém WebSocket/SSE nem uma
conexão permanente por conversa. Renovação de sessão utiliza o mecanismo existente;
tokens não são colocados na URL. Não há promessa de push com navegador fechado ou
de atualização instantânea homologada. Consulta de leitura só escreve quando o
cursor avança; envio confirmado tem estado factual de enviado, sem recibo fictício
de leitura coletiva.

Retenção indefinida é o comportamento operacional atual, não uma avaliação jurídica
de prazo de guarda. Antes da operação pública, o responsável precisa alinhar a
política de privacidade, backups e prazo de retenção. Anonimização de mensagens
substitui autor/conteúdo pessoal preservando ordenação e eventos do sistema.

## Migrações e configuração

Novas migrations incrementais:

- `V21__conversas_notificacoes_enderecos.sql`: conversas, mensagens, cursores de
  leitura, avisos internos e endereços frequentes, índices e restrições. Repete a
  proteção de acesso direto/RLS usada no projeto para Supabase.
- `V22__cadastro_cliente_verificacao_google.sql`: verificação de e-mail, identidade
  Google, senha local e nome de usuário com limite compatível com cadastro existente.
  Usuários existentes continuam com e-mail verificado; não há bloqueio retroativo.

| Variável | Uso |
|---|---|
| `GOOGLE_CLIENT_ID` | Audiência autorizada no backend; vazio desabilita Google |
| `VITE_GOOGLE_CLIENT_ID` | Mesmo OAuth client ID público no build do frontend |
| `PUBLIC_FRONTEND_URL` | URL pública usada nos links de confirmação e recuperação |
| `APP_PASSWORD_RESET_PROVIDER` | Provedor do fluxo de identidade (`local` ou `resend`) |
| `RESEND_API_KEY`, `RESEND_FROM` | Envio real de confirmação/convite quando habilitado |
| `CHAT_POST_COMPLETION_HOURS` | Padrão 48 |
| `CHAT_MAX_CHARS` | Padrão 2.000, teto do servidor 2.000 |
| `CHAT_SENDS_PER_MINUTE` | Padrão 20 |

Exemplos foram atualizados em `.env.example` e `ops/`; Docker/Compose repassam as
variáveis e o client ID público no build. Nenhum arquivo de credenciais reais foi
alterado. Provedor local serve desenvolvimento: não representa entrega real de e-mail.

Google requer cliente OAuth web, origens autorizadas para os domínios utilizados,
client IDs coincidentes e saída HTTPS do backend para as chaves públicas do Google.
Não usa client secret no navegador. A validação segue a
[documentação oficial dos tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
e o botão usa a
[API oficial do Google Identity Services](https://developers.google.com/identity/gsi/web/reference/js-reference).

Antes do primeiro deploy, realizar backup, verificar credenciais/URLs, executar
migrations no ambiente de homologação e revisar os contatos configurados. A flag
existente de Pix e as configurações financeiras continuam autoritativas. Não
executamos essas ações em produção durante esta tarefa.

## Infraestrutura e estimativa de impacto

Não há licença adicional obrigatória de chat, n8n ou IA. Persistência utiliza o
PostgreSQL e o servidor existentes. CPU/RAM, consultas, banco/backups, tráfego,
e-mail de identidade, observabilidade e manutenção continuam tendo custo.

Exemplo de planejamento, sem representar benchmark: 50 painéis de conversa ativos
com três GETs por ciclo de oito segundos geram aproximadamente **18,75 GETs/s**,
mais até **3,33 GETs/s** para os dois badges por usuário a cada 30 segundos.
Leitura gera PATCH apenas quando o cursor avança; envio e outros cliques acrescentam
requests. Paginação limita resultados, mas abertura inicial e busca também consultam
o banco. Aba oculta interrompe polling; não é estimativa para 50 contas conectadas
com navegador fechado.

Com hipótese conservadora de 5 KB por mensagem incluindo índices/overhead, 1.000
mensagens/dia representam aproximadamente 5 MB/dia ou 1,8 GB/ano, antes de backups,
logs e demais tabelas. O tamanho real depende do texto e do PostgreSQL; medir em
homologação antes de escolher um plano ou prometer que a capacidade atual basta.
Não foi atribuído preço mensal sem conhecer os planos contratados.

Registrar mensalmente: quantidade de mensagens, tamanho de tabelas/índices e
backups, usuários simultâneos, conexões/pool, requests, latência p95, CPU/RAM,
tráfego e e-mails. Usar métricas existentes do servidor/host e PostgreSQL. Não
instalar extensão ou serviço pago apenas para ativar o chat. O limitador atual é
local ao processo: múltiplas réplicas precisam de limite global na borda ou
armazenamento compartilhado antes de prometer o mesmo teto agregado.

## Verificação executada

Backend: `mvn verify` em diretório de saída isolado, com PostgreSQL 16 por
Testcontainers. **147 testes unitários e 52 de integração aprovados**, sem falhas,
erros ou testes ignorados. A execução final usou Java 21.0.12.1; uma execução
adicional com Java 25 compilando para release 21 também passou.
O isolamento evita disputa com a compilação automática do editor sobre `target/`.

Os novos testes cobrem assinaturas RSA/claims Google, cadastro e replay de token,
perfil forjado por HTTP, convite com vínculo válido, proprietário operacional,
acesso cruzado, desativação, reatribuição, concorrência de criação/envio,
idempotência, leitura monotônica, histórico paginado, limite de frequência,
encerramento/reabertura, edição/reprecificação com versão, cancelamento e
exportação/anonimização. Os testes financeiros e de paradas existentes também
foram executados. Não substituem homologação com contas e provedores reais.

Frontend: **16 arquivos / 49 testes aprovados** com `npm test -- --maxWorkers=1`.
Inclui texto escapado, resposta perdida com UUID estável, conversa de leitura e
revogação. Uma execução paralela teve timeouts; execução com um worker passou.
`npm run build` passou (TypeScript + Vite). Não há script de lint no projeto.
Permanece o aviso de bundle principal acima de 500 KB; não impede o build.

Revisão de código conferiu escopo no servidor, payloads não autoritativos, locks,
idempotência, tratamento de erros, preservação histórica e ausência de secrets.
As telas foram inspecionadas em desktop (1.440), tablet (768) e celular (390),
com troca de modo, menu, rota/pagamento e conversa. Não houve overflow horizontal
nas verificações móveis. Modal teve Tab/Shift+Tab, Escape e retorno de foco conferidos.

## Evidências visuais

Dados fictícios, API local de demonstração. As capturas não são do ambiente real.

- [Proprietário](evidencias/plano-2026-10-09/proprietario-desktop.png)
- [Resumo operacional](evidencias/plano-2026-10-09/entregador-desktop.png)
- [Rota e pagamento desktop](evidencias/plano-2026-10-09/operacao-desktop.png)
- [Rota e pagamento móvel](evidencias/plano-2026-10-09/operacao-mobile.png)
- [Cliente desktop](evidencias/plano-2026-10-09/cliente-desktop.png)
- [Cliente móvel](evidencias/plano-2026-10-09/cliente-mobile.png)
- [Conversa desktop](evidencias/plano-2026-10-09/conversa-desktop.png)
- [Conversa móvel](evidencias/plano-2026-10-09/conversa-mobile.png)

## Pendências externas de homologação

Configurar e testar OAuth Google e e-mail real, revisar conteúdo de privacidade e
retenção, executar as migrations em homologação e fazer teste de carga com o pool,
latência e simultaneidade representativos da implantação. Medições reais de
conexões/consultas na infraestrutura hospedada e recuperação sob falha desse
ambiente não foram realizadas. Não há aprovação de produção ou promessa de tempo
real. Push e deploy não fazem parte desta entrega local.

## Commits locais

- `1c40056` — feat: implementar acessos, conversas e pedidos dos clientes.
- `6b18ed1` — feat: completar portais e operação sem foto ou código.
- `eff158a` — chore: configurar Google e limites das conversas.
- Documentação — docs: registrar regras e validação do plano JS Boy.

Consultar `git log -4 --oneline` para os identificadores completos da entrega.
