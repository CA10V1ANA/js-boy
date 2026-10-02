# Estabilização web + API — evidências e próximos passos

Atualizado em 02/10/2026. Este registro acompanha o plano
`JS_BOY_ARQUITETURA_E_PLANO_DE_ENTREGA_2026.md`. A base examinada é `main`
em `1e121184055a4c41e275b4ff5919bf56ce2870ff`, com alterações locais
preexistentes ainda não validadas. Nenhuma conclusão abaixo atesta o ambiente
publicado.

| ID | Estado | Evidência nesta revisão | Próxima condição de saída |
|---|---|---|---|
| T01 (P0) | Em andamento | `docker-compose.yml` descreve PostgreSQL local; `docker-compose.prod.yml` usa volume `postgres_data` e comprovantes em `PROOF_STORAGE_PATH`; os scripts de backup existem. No painel Railway, `js-boy-staging` contém PostgreSQL e volume do backend, mas o banco está offline; a tela de dados requer deployment online. O projeto `exquisite-enthusiasm` mostra somente um serviço com build falho. O Docker local foi iniciado em 01/10 para Testcontainers. Não se obteve histórico aplicado ou backup do banco vigente. Caio decidiu não importar esses dados. | Identificar o novo projeto Supabase; confirmar e registrar o estado vazio do histórico Flyway e obter backup verificável antes de alterar migrations existentes. Não apagar o ambiente Railway antigo. |
| T02 (P0) | Teste local passou; banco de destino pendente | O commit base contém `V13__business_contact.sql` e `V13__operational_growth.sql`. A árvore de trabalho já remove a segunda V13 e acrescenta V15/V16. Nesta árvore, `MigrationLocalTest` executou as 16 versões em PostgreSQL 16 descartável sem erro. Ainda não há histórico do banco Supabase novo nem ensaio de restauração. | Reconciliar os scripts com o histórico confirmado no banco novo e repetir a validação em restauração isolada antes de aceitar a mudança. |
| T03 (P0) | Gate local passou; release pendente | Em 01/10, `mvn clean verify` com Java 21, Maven 3.9.9 e Testcontainers/PostgreSQL 16 passou: 103 testes unitários e 11 de integração, zero falhas/erros/ignorados, em saída Maven isolada. Um ensaio anterior no `backend/target` falhou na compilação por `.class` ausentes; havia processos Java da IDE, e uma disputa pelo diretório é hipótese, não causa confirmada. Na web, `npm ci`, 23 testes, `npm run build` e `npm audit --audit-level=high` passaram; o Vite avisou sobre chunk superior a 500 kB. Resultados da árvore de trabalho sem commit; CI remoto e homologação não executados. | Repetir CI e homologação no mesmo commit/artefato candidato, inclusive Supabase e Storage, antes de qualquer publicação. |
| T09 (P1) | Adaptador local implementado; conexão pendente | Caio escolheu Supabase para PostgreSQL e comprovantes em 01/10. A conta conectada mostra um projeto genérico `CA10V1ANA's Project` em estado `INACTIVE`; seu vínculo com o JS Boy não foi confirmado. A API agora seleciona o adaptador S3 do Supabase por `APP_STORAGE_PROVIDER=supabase-s3`, mantendo o armazenamento local como padrão e as mesmas rotas/regras de acesso. Testes com S3 simulado cobrem upload, download, listagem paginada, ausência 404, falha de permissão 403, exclusão idempotente e chave inválida. Não se testou conexão real Spring Boot–Supabase, SSL, grants, pool ou bucket privado. | Identificar o novo projeto e criar bucket privado; validar upload, download, acesso negado, exclusão, reconciliação e backup dos bytes em homologação; testar também a conexão Railway–Supabase para o banco. |
| T04 (P1) | Crítico/altos tratados localmente; revisão restante | `npm audit` inicialmente encontrou 1 crítico (`jspdf`), 2 altos (`axios`, `nanoid`), 4 moderados e 1 baixo. Atualização dirigida fixou `jspdf` em 4.2.1, `axios` em 1.20.0, `react-router-dom` em 6.30.6 e atualizou o `nanoid` transitivo; `npm ci` e `npm audit --audit-level=high` passaram com 0 críticos/altos. A geração básica de PDF com texto e gráfico produziu um arquivo válido; 4 moderados e 1 baixo permanecem. | Revisar os alertas residuais e executar a exportação de relatório no navegador antes da homologação. Manter alterações de dependências identificáveis separadamente das correções de comportamento. |
| T08 (P1) | Correção parcial com teste local | `SincronizacaoOfflineService` passou a rejeitar a reutilização de chave por outro `entregaId` ou status com 409; repetição idêntica consulta a entrega atual. Três testes unitários direcionados passaram. O payload de comprovantes e corridas simultâneas ainda não foram resolvidos. | Cobrir comprovantes com comparação do payload e verificar concorrência/constraint em PostgreSQL sem alterar migrations existentes antes de T01. |
| A09 (P1) | Corrigido localmente | `apiErrorMessage` preserva a mensagem segura enviada pela API para 409. Três testes verificam saldo, cancelamento, versão antiga e fallback; a suíte web passou com 23 testes e o build concluiu. | Confirmar a apresentação nas telas em homologação, inclusive respostas de segurança e perda de rede. |
| A10 (P1) | Aberto | `PagamentosPage` ainda gera nova `Idempotency-Key` em cada tentativa de pagamento/estorno; perda de resposta seguida de novo envio pode duplicar um lançamento parcial. A API já compara chave e hash quando a chave é a mesma. | Definir e implementar persistência da intenção por usuário e recuperação após reload; testar resposta perdida, retry idêntico, payload alterado e estorno. Não criar retry automático de escrita antes disso. |
| V01 | Configuração local pronta | `frontend/vercel.json` adiciona o rewrite SPA para `index.html` e cabeçalhos de segurança equivalentes aos do Nginx; JSON válido, build e 23 testes web passaram. O app Vercel pediu nova autenticação; nenhuma publicação foi feita. | Após reconexão, conferir root `frontend/`, `VITE_API_URL` HTTPS, rotas diretas, cabeçalhos e deployment correspondente ao commit validado. |
| D01 | Gate de preparo limitado ao escopo web/API | O workflow manual agora chama `ci.yml` com `web_api_only=true`, mantendo o job Flutter nas execuções normais de CI e omitindo-o somente do preparo desta entrega. Ambos os YAML foram analisados por parser local; o fluxo remoto não foi executado. | Confirmar em GitHub Actions que o preparo manual exige backend, frontend e infraestrutura aprovados no mesmo commit antes de gerar artefatos. |
| T22 (P2) | Decisão de destino registrada | `docs/arquitetura-web-api.md` registra web Vercel, API Railway, PostgreSQL e comprovantes Supabase, autoridade da API, Flyway único, limites de réplica e sequência de gates. Os runbooks antigos receberam aviso de topologia anterior. | Revisar esta decisão com o responsável e reconciliar os runbooks de implantação após a infraestrutura de homologação existir. |
| W01 | Inspeção de código; homologação pendente | O navegador oferece `/minhas-entregas` e `/meu-faturamento` ao perfil `ENTREGADOR`/`FUNCIONARIO`. A página operacional lista e filtra entregas, confirma coleta/rota/entrega, pede OTP, envia comprovante e cadastra cliente; a outra consulta extrato mensal. Na API, `FUNCIONARIO` vinculado a entregador recebe o papel efetivo `ENTREGADOR`; sem vínculo não recebe autoridade. | Validar essas ações em navegador de celular real, inclusive perda de conexão e resposta perdida, sem confirmação falsa. |

Em 01/10, Caio decidiu iniciar o Supabase com **um banco novo e vazio**, que
ainda será criado; não
quer importar os dados da Railway. Isso retira a exportação dos dados antigos
do caminho de implantação do novo ambiente, sem autorizar apagar ou alterar o
banco antigo. Antes de alterar migrations existentes, registrar no banco novo
o estado de `flyway_schema_history` (ausente em banco realmente vazio) e obter
um backup verificável desse estado. Não usar `repair`, `baseline` ou limpeza
para contornar erro de migração. Depois, executar V1–V16 em PostgreSQL vazio e
validar o esquema e os testes no mesmo commit a publicar. Na árvore atual há
16 arquivos com versões únicas. Em 01/10, a criação do esquema em PostgreSQL 16
descartável passou; isso não comprova o estado do futuro banco Supabase.

Para reproduzir os testes locais, o Docker Desktop 29.6.1 foi iniciado, Maven
3.9.9 foi adicionado ao PATH do usuário e Java 21 foi definido em `JAVA_HOME`.
O `pom.xml` tinha um ciclo de interpolação em `build.directory`, corrigido com
uma propriedade própria. `MigrationLocalTest` passou a usar o PostgreSQL do
Testcontainers, pois V11 não é aceita pelo H2. O arquivo de recurso de teste
`docker-java.properties` fixa a API Docker 1.44 para compatibilidade com o
daemon atual; `AuthControllerIT` usa o cliente HTTP do Java para receber o 401
dos testes de login inválido. Não houve alteração em migrations existentes.

## Direção de hospedagem definida pelo responsável

Em 01/10, Caio definiu **Vercel para o frontend React/Vite, Railway para a
API Spring Boot e Supabase para PostgreSQL e comprovantes**. Essa é uma decisão
de destino, não uma migração já executada. O navegador deve chamar a API
Railway por HTTPS, sem credenciais do banco ou Storage no bundle. O projeto
Vercel deve usar `frontend/` como diretório raiz,
`VITE_API_URL` com a URL pública da API, e rewrite das rotas React para
`index.html`. Validar CORS, links de recuperação e cabeçalhos no domínio final;
`frontend/nginx.conf` não controla os cabeçalhos de uma publicação estática na
Vercel.

Os **comprovantes** devem ir para um bucket privado no Supabase Storage, mas o
backup PostgreSQL não inclui seus bytes. O adaptador `ArmazenamentoSupabaseS3`
implementa `ArmazenamentoArquivo` com o protocolo S3 do Supabase. A seleção é
feita na API com `APP_STORAGE_PROVIDER=supabase-s3` e as variáveis
`SUPABASE_STORAGE_S3_ENDPOINT`, `SUPABASE_STORAGE_S3_REGION`,
`SUPABASE_STORAGE_S3_ACCESS_KEY_ID`, `SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY`
e `SUPABASE_STORAGE_BUCKET`; o endpoint esperado termina em `/storage/v1/s3`.
Essas credenciais ficam somente na Railway. O padrão continua sendo
`ArmazenamentoLocalArquivo`. As rotas de upload/download continuam passando por
`ComprovanteService` e `EntregaAcessoService`, sem URL pública de arquivo.
Validar em homologação que o bucket existe, é privado e que as credenciais S3
funcionam. Fazer backup separado dos bytes e testar restauração. Separar a
conexão do banco, a mudança de arquivos e a configuração web em etapas
verificáveis; não migrar identidade. Verificar
plano/custo antes de publicar uso
empresarial: a [Vercel limita Hobby a uso pessoal não comercial](https://vercel.com/docs/plans/hobby),
e o [Supabase recomenda exportação externa regular no plano Free](https://supabase.com/docs/guides/platform/backups).

Testar a conexão persistente Railway–Supabase via endpoint direto ou Session
Pooler conforme rede e suporte IPv6. Guardar credenciais do banco e do Storage
somente na API. Fontes:
[Storage S3](https://supabase.com/docs/guides/storage/s3/compatibility),
[conexões PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres),
[backups Supabase](https://supabase.com/docs/guides/platform/backups) e
[planos Railway](https://docs.railway.com/pricing/plans).

## Coleta necessária para encerrar T01

O operador do ambiente vigente deve registrar **qual** banco e volume atendem a
API atual, sem copiar credenciais para este documento. Em conexão autorizada e
somente de leitura, exportar o resultado de:

```sql
SELECT installed_rank, version, description, script, checksum, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

Usar os scripts existentes `ops/backup-postgres.sh` e `ops/backup-proofs.sh`
com a chave pública `age` do responsável, identificar os dois artefatos da
mesma janela e guardar seus SHA-256. Confirmar `pg_restore --list` e restaurar
em ambiente isolado, verificando também os arquivos de comprovantes. Registrar
origem, data, versão PostgreSQL, tamanho, checksum, local protegido e resultado
do ensaio, sem incluir dados pessoais ou segredos no backlog.

O [ensaio automatizado de 01/10](https://github.com/CA10V1ANA/js-boy/actions/runs/36860848646)
falhou antes do dump (`BACKUP_ENCRYPTION_RECIPIENT: required`). Ele usava uma
tabela fictícia e não constitui backup do ambiente vigente nem restauração
completa da aplicação.

No [projeto Railway de homologação](https://railway.com/project/64b7c509-7ddc-47db-8b7b-55c1afe039d2?environmentId=2713b2e5-c976-4777-850b-acf30e4ae533),
o PostgreSQL aparece offline. A aba de backups não apresentou um artefato
consultável e informou que criar backups/PITR exige plano Pro. Isso não prova
que nenhuma cópia externa exista. O painel também indica trial expirado; não
há deployment ativo do PostgreSQL, e o histórico mostra uma imagem
`postgres-ssl:18` removida. A versão efetiva dos dados não foi consultada.
Não foi feita ativação, alteração de plano nem escrita no banco. No
[projeto rotulado produção](https://railway.com/project/3b384a20-e607-4a9c-be3c-5da4fb14cf09?environmentId=e3ad10c9-bd0a-4042-9f76-4fd5289d2c1c),
o canvas exibiu somente um serviço com build falho, sem PostgreSQL visível.

Não alterar migrations aplicadas, executar `repair`/`baseline`/`clean` nem
promover artefato enquanto T01 e os gates seguintes estiverem abertos.

## Escopo do navegador do entregador

A confirmação acima é de **rotas e chamadas implementadas**, não de execução
real. A web chama `/entregas/minhas-entregas`, o PATCH de status com `If-Match`,
`/operacao-entregador/resumo`, criação de cliente, pedido de OTP, upload de
comprovante e `/operacao-entregador/financeiro/extrato`. A API também mantém
endpoints de paradas e ocorrências; eles não devem ser removidos por não
aparecerem nesse fluxo web. Regras de acesso, status, comprovantes, saldo e
fechamento continuam sendo responsabilidade da API.
