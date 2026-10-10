# Matriz de permissões

Atualizada em 09/10/2026 para os portais, cadastro e conversas por entrega.

## Modelo de acesso

A JS Boy é a única empresa operadora. Existem três perfis: PROPRIETARIO,
ENTREGADOR e CLIENTE. FUNCIONARIO continua sendo um alias legado de entregador,
sem privilégios adicionais. Cadastro público cria exclusivamente cliente.

O proprietário pode vincular a própria conta a um entregador ativo. Nas rotas
/operacao-entregador, o backend exige esse vínculo e restringe a operação às
entregas atribuídas a ele. Desativar o vínculo bloqueia a operação e preserva o
acesso administrativo. Não é criada uma segunda conta.

O servidor verifica posse, perfil, vínculo ativo, estado e versão. UUID recebido
não comprova autorização. Consultas fora do escopo retornam 404; operações
incompatíveis com o perfil retornam 403. Menus e guards não substituem isso.

## Matriz

Próprias significa entregas do cliente vinculado ou atualmente atribuídas ao
entregador. A coluna operacional também se aplica ao proprietário nesse contexto.

| Recurso / ação | Proprietário administrativo | Entregador / proprietário operacional | Cliente |
|---|---|---|---|
| Clientes: listar, cadastrar, administrar | Toda a operação | Não | Consultar/editar contato e preferências próprios |
| Entregadores e acessos internos | Gerenciar e convidar | Consultar vínculo e atualizar telefone próprio | Não |
| Vínculo operacional do proprietário | Criar na própria conta | Usar enquanto ativo | Não |
| Entregas: consultar | Todas | Próprias | Próprias, visão permitida |
| Entregas: criar | Cadastro administrativo | Não | Solicitar, sem definir preço/status/designação |
| Entregas: editar | Conforme estado e regras existentes | Não | Solicitação simples com duas paradas, SOLICITADA, antes da análise, com versão válida |
| Entregas: cancelar | Conforme máquina de estados | Não | Própria, antes da coleta, sem recebimento, com motivo e versão válida |
| Entregas: repetir | Cadastro administrativo | Não | Nova solicitação para revisão, sem copiar preço, status ou responsável |
| Designação e edição de rota | Conforme estado, versões e regras financeiras | Não | Não |
| Avanço operacional, tentativa e retomada | Conforme máquina de estados | Próprias, etapas permitidas | Não |
| Concluir parada | Ordem e versão válidas | Próprias, ordem e versão válidas | Não |
| Confirmar Pix/dinheiro | Conferência administrativa auditada | Próprias, recebedor/referência válidos e auditoria | Não |
| Finalizar entrega | Saldo regular e todas as paradas concluídas | Mesmas condições, em entrega própria | Não |
| Estornar / razão financeiro | Regras financeiras existentes | Não | Não |
| Financeiro | Toda a operação | Extrato e valores movimentados próprios | Histórico e saldo das entregas próprias, somente leitura |
| Endereços frequentes | Sem autosserviço de terceiros | Não | CRUD próprio, sem mudar entregas históricas |
| Conversa por entrega | Todas | Atribuições atuais, vínculo ativo | Entregas próprias |
| Reabrir conversa | Motivo, prazo futuro de até sete dias e auditoria | Não | Não |
| Notificações internas | Próprias, com acesso atual ao destino | Próprias e limitadas à operação atual | Próprias |
| Preços, relatórios administrativos, empresa e usuários | Gerenciar | Não | Não |
| Privacidade | Fluxo administrativo existente | Não | Exportar dados próprios e solicitar anonimização |
| Ajuda e contato | Contato configurado da empresa | Contato configurado da empresa | Contato configurado da empresa |

## Identidade e convites

Cadastro por senha depende de confirmação do e-mail por token com hash, prazo de
24 horas e uso único. Reenvio e cadastro possuem limites e respostas genéricas.
E-mail alterado na conta do cliente exige nova confirmação. O acesso Google
valida assinatura, emissor, audiência, expiração e e-mail verificado no servidor;
aceita somente cliente. Associar Google a uma conta existente requer sessão
autenticada e identidade compatível. Não promove cliente a perfil interno.

O proprietário convida entregadores por definição de senha de uso único.
A senha inicial é aleatória e não é entregue ao operador. Perfil operacional
não edita atividade, comissão, documento, vínculos ou movimentações históricas.

## Operação e conversa

Dinheiro é apresentado primeiro. Pix é direto ao entregador designado, com
recebimento manual autorizado. Foto, OTP e comprovante não são requisitos para
concluir; documentos históricos permanecem preservados. Identificador da entrega
é administrativo e não é código de confirmação.

Mensagem nunca altera preço, status, saldo ou paradas. Chat verifica autorização
em cada consulta e envio. Troca de responsável ou desativação revoga o acesso do
entregador anterior, inclusive no próximo ciclo de atualização da tela.
Cancelamento fecha o envio imediatamente. Conclusão permite envio por 48 horas
configuráveis; depois mantém leitura para usuários ainda autorizados. Reabrir
conversa não reabre a entrega. Proprietário que entrega aparece uma vez.

## Evidências

Os testes e os limites da homologação estão registrados no
[relatório da implementação](plano-implementacao-2026-10-09.md).
