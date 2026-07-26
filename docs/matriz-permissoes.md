# Matriz de permissões

## Modelo autoritativo

A JS Boy é a única empresa operadora. O sistema não é multi-tenant e não existe
o papel de atendente. Os únicos papéis de negócio são:

- `PROPRIETARIO`: administra toda a operação da JS Boy;
- `ENTREGADOR`: funcionário da JS Boy que realiza entregas;
- `CLIENTE`: pessoa ou empresa que contrata a JS Boy.

`FUNCIONARIO` é um alias temporário e depreciado de `ENTREGADOR`. Enquanto
existirem usuários legados com esse valor, eles devem receber exatamente as
mesmas permissões e restrições de `ENTREGADOR`. Não se deve criar novos acessos
com esse perfil; a migração para `ENTREGADOR` depende de vínculo válido com a
entidade de entregador.

Não há `ATENDENTE`, nem perfil equivalente.

## Princípios de autorização

1. O backend decide o escopo a partir do usuário autenticado e de seus vínculos.
2. `clienteId` e `entregadorId` recebidos por URL ou payload nunca provam posse.
3. Um usuário `CLIENTE` precisa estar vinculado a exatamente um `Cliente`.
4. Um usuário `ENTREGADOR` precisa estar vinculado a exatamente um `Entregador`.
5. A ausência ou ambiguidade do vínculo nega o acesso.
6. Esconder controles na interface é apenas conveniência; requests manuais
   continuam sujeitos às mesmas regras no backend.
7. Em consulta a registro fora do escopo do usuário, a API deve preferir `404`
   para não confirmar que o recurso existe. Uma ação conhecida, mas proibida
   para o papel, retorna `403`.
8. O proprietário também respeita regras de domínio, como estados terminais,
   idempotência financeira e limites de estorno.

## Matriz

Legenda: `Tudo` = toda a operação; `Próprio` = somente o registro vinculado ao
usuário; `Operacional` = somente campos e transições necessários à entrega;
`—` = não permitido.

| Recurso / ação | PROPRIETARIO | ENTREGADOR | CLIENTE |
|---|---|---|---|
| Cliente — listar | Tudo | — | — |
| Cliente — consultar | Tudo | Dados mínimos da entrega própria | Próprio |
| Cliente — criar, aprovar ou vincular acesso | Tudo | — | — |
| Cliente — editar | Tudo | — | — |
| Entregador — listar | Tudo | — | — |
| Entregador — consultar | Tudo | Próprio | — |
| Entregador — criar, editar ou vincular acesso | Tudo | — | — |
| Entrega — listar | Tudo | Próprio | Próprio |
| Entrega — consultar | Tudo | Próprio, visão operacional | Próprio, visão permitida |
| Entrega — criar | Tudo | — | — no P0 |
| Entrega — editar | Tudo, quando o estado permitir | — | — |
| Entrega — designar ou trocar entregador | Tudo, somente antes da coleta | — | — |
| Entrega — alterar status | Tudo, conforme máquina de estados | Próprio, somente avanço operacional permitido | — |
| Entrega — cancelar | Tudo, antes da coleta e conforme máquina de estados | — | — |
| Histórico — consultar | Tudo | Próprio, histórico operacional | Próprio, eventos permitidos |
| Pagamento — listar ou consultar | Tudo | — | Próprio |
| Pagamento — registrar | Tudo | — | — |
| Pagamento — estornar | Tudo, conforme saldo e idempotência | — | — |
| Relatório operacional ou financeiro | Tudo | — | — |
| Configuração de preço | Gerenciar | — | — |
| Usuários e acessos | Gerenciar | — | — |
| Solicitação de contato pública | Consultar e tratar | — | Criar sem autenticação, com proteção antiabuso |

## Transições operacionais do entregador

O entregador nunca escolhe ou troca a designação. Para uma entrega já atribuída
a ele, pode apenas avançar pelas etapas operacionais liberadas pela máquina de
estados, como:

- `ENTREGADOR_DESIGNADO → COLETADA`;
- `COLETADA → EM_ROTA`;
- `EM_ROTA → ENTREGUE`.

Não pode regressar status, cancelar após coleta, editar valor, editar dados
financeiros ou agir sobre entrega de outro entregador.

## Cadastro e vínculos

O P0 não oferece cadastro público automático. O proprietário cadastra ou aprova
o cliente e cria o acesso vinculado. O mesmo vale para o acesso do entregador.
Uma conta sem vínculo válido permanece autenticável apenas se necessário para
diagnóstico, mas não recebe acesso às áreas protegidas de negócio.

## Casos mínimos de teste

- proprietário acessa recursos administrativos;
- entregador lista e altera somente entregas próprias;
- `FUNCIONARIO` legado é tratado como entregador, sem privilégios extras;
- entregador não se designa nem acessa entrega alheia;
- cliente consulta somente cadastro, entregas e pagamentos próprios;
- cliente não altera status nem registra ou estorna pagamento;
- conta sem vínculo recebe acesso negado;
- troca manual de UUID não expõe a existência nem os dados do registro.
