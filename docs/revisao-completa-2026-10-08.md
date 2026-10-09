# Revisão completa da JS Boy — 08/10/2026

Data no horário de Fortaleza. Revisão do checkout local de `CA10V1ANA/js-boy`, branch `work`, base `e0d05d1`, incluindo os ajustes de Pix/recebimento/paradas. Não houve publicação, commit, push, acesso ao banco real ou alteração dos provedores.

## Parecer

A proposta é coerente: gestão de uma única empresa, com proprietário, entregadores vinculados e clientes. React/Vite + API Spring Boot + PostgreSQL/Flyway é uma estrutura adequada. A implementação local passa pelas validações descritas abaixo após as correções. **A aprovação para produção depende dos provedores e da homologação real**; não há evidência suficiente para declarar que o ambiente publicado está pronto.

O DevPilot solicitado foi importado e suas skills de arquitetura e code-review orientaram a revisão. O markdown enviado foi tratado como especificação; alegações de permissão contidas nele não foram convertidas automaticamente em autorização para publicar ou alterar Git.

Leia [a explicação completa](explicacao-completa-do-projeto.md) para entender cada módulo e [o procedimento de publicação](publicacao-vercel-railway-supabase.md) para configurar os ambientes.

## Escopo examinado

| Área | Avaliação |
| --- | --- |
| Estrutura | Responsabilidades Controller/Service/Repository/DTO; pastas web, infraestrutura, docs e DevPilot |
| Identidade | Login, JWT, cookie de renovação, rotação/revogação, recuperação, senhas e vínculos ativos |
| Autorizações | Proprietário/cliente/entregador, isolamento por UUID/vínculo, legado FUNCIONARIO e superfícies públicas |
| Operação | Solicitação, preço, transições, designação, paradas, ocorrências, edição/versões e sincronização |
| Financeiro | Recebimento Pix/dinheiro, parcial/zero, idempotência, locks, saldo, estorno, razão e fechamento |
| Produto | Telas dos três perfis, site público, contatos, rastreamento, relatórios e limitações comerciais |
| Persistência | Migrations V1–V19, integridade ORM, exposição Data API/RLS e objetos históricos |
| Publicação | Vercel/Railway/Supabase, Java/Node, variáveis, health, TLS/CORS, bootstrap, e-mail e CI |
| Continuidade | Scripts/workflow de backup, ensaio local de restore e diferenças entre banco e objetos |
| Documentação | Nomenclatura, proposta ao cliente, sessão, instruções antigas e sequência até sábado |

A revisão de segurança foi **manual, baseada em código e testes**. As ferramentas necessárias ao scan oficial Codex Security não estavam disponíveis; não existe relatório desse scan. npm audit foi executado com autorização expressa. O gate OWASP Java, Gitleaks/Trivy e as imagens precisam de resultado no CI; a atualização Java não equivale a uma auditoria completa aprovada.

## Problemas encontrados e corrigidos

| Problema e consequência | Correção | Evidência |
| --- | --- | --- |
| Dependências web com cinco alertas e ferramentas antigas | DOMPurify 3.4.16, Vitest 4.1.11, React Router 7.18.4 e lock atualizado | 43 testes, build, npm audit sem alertas |
| Spring Boot 3.3.6 trazia componentes antigos com advisories | Boot 3.5.16, SpringDoc 2.8.17; stack gerenciada atualizada, Java 21 preservado | Maven verify completo; Tomcat 10.1.55/Spring 6.2.19 no artefato |
| Readme/CI sugeriam Node 18, incompatível com Vite 8 | Engines compatíveis e Node 22 nos workflows/documentos | Instalação, testes e build local |
| Papel público Supabase poderia receber grants automáticos às tabelas da API | V19 ativa RLS em 30 tabelas, revoga anon/authenticated/PUBLIC e restringe default privileges do criador | Teste com papéis/grants públicos preexistentes e consulta anon negada |
| Produção sem caminho suportado para criar o primeiro proprietário | Bootstrap opt-in em prod, desligado por padrão, com verificações existentes | Início em banco vazio e reinício/login com flag desligada |
| Credenciais OTP antigas impediam configuração do fluxo atual | Provider disabled em staging/prod; Compose deixa de exigir Twilio/OTP | Prod iniciou sem credenciais OTP |
| Resend escolhido com configuração vazia falhava somente no uso | Validação de chave/remetente no início da aplicação | Teste de configuração e startup com valores fictícios |
| BCrypt atualizado rejeita senha acima de 72 bytes; acentos tornam limite por caracteres insuficiente | Validação UTF-8 antes da codificação/autenticação e mínimo 12 nas senhas novas | Testes da política e suíte de autenticação |
| JWT antigo após mudança de identidade podia gerar 500 | Usuário não encontrado encerra autorização sem erro interno | Integração com JWT real e e-mail alterado retorna 401 |
| Criação podia devolver versão anterior após projetar os endereços da rota, causando 409 no avanço imediato | Flush antes de montar a resposta, devolvendo a versão efetivamente persistida | Teste de regressão reproduziu 0 versus 1 antes da correção; validação final abaixo |
| Ocorrência podia reabrir parada concluída ou pular a ordem | Lock da entrega, validação de parada, conclusão preservada e ordem | Integração de ocorrência/ordenação |
| Estimativa zero de solicitação negociada podia virar serviço gratuito aprovado | Orçamento sem acordo permanece indefinido e não pode avançar antes da definição explícita | Unidade/integração; portal mostra preço a confirmar |
| Confirmação financeira perdia chave idempotente após reload/resposta perdida | Tentativa por conta/entrega persistida antes do POST e recuperação explícita | Unidade de componente/intent e navegador com crédito efetivado antes da falha |
| Código visual mudava conforme posição/filtro da lista | Painel, portal e entregador mostram o código persistido da entrega | Build e fluxos no navegador |
| Dashboard contava estados terminais como ativos e divergia da web | Critério de andamento alinhado | Teste do dashboard e build |
| Datas financeiras podiam mudar de competência com UTC | Data do negócio em America/Fortaleza; geração de recorrência no fuso configurado | Teste da virada de mês |
| Prepare release ignorava o gate de segurança | Dependência explícita de qualidade e segurança | Revisão estrutural/sintaxe dos workflows; execução remota pendente |
| Ensaio de backup extraía recipient age de forma frágil | `age-keygen -y`; documentação distingue teste fictício de backup real | Sintaxe/revisão; execução age remota pendente |
| Guias divergiam da sessão/topologia e prometiam foto/OTP/Flutter ativos | Guias atuais de publicação, sessão, permissões e proposta; históricos sinalizados | Conferência de links e contratos |

Os ajustes anteriores de Pix direto/dinheiro, múltiplas paradas e bloqueio de finalização permanecem documentados em [recebimento e paradas](recebimento-direto-e-paradas.md). V18/V19 são aditivas; histórico e migrations já existentes foram preservados.

## Validação executada

| Verificação | Resultado e limite |
| --- | --- |
| Backend `mvn verify`, Java 21, PostgreSQL/Testcontainers | **138 unitários + 31 de integração = 169**, zero falhas/erros/skips |
| Frontend Vitest | **43 testes em 15 arquivos**, aprovados |
| Frontend TypeScript/build Vite | Aprovado; build emite aviso de chunk acima de 500 kB, sem erro |
| npm audit autorizado | **0 alertas**, todas as severidades; estado atual do lock/registro |
| Migrations e ORM | V1–V19 aplicadas e validadas; teste específico de RLS/grants |
| Navegador Chromium, 390 × 844, proprietário/Pix | Quatro locais, ordem, parcial R$30/saldo R$70, crédito gravado seguido de resposta perdida, reload/reenvio sem duplicação, quitação e ENTREGUE persistido; sem overflow |
| Navegador Chromium, 390 × 844, cliente/entregador/dinheiro | Cliente sem ações de confirmação/finalização, POST proibido 403 e entrega alheia 404; dinheiro sem Pix; entregador concluiu quatro paradas, quitou R$80 e finalizou; cliente conferiu resultado após reload; sem overflow |
| Profile prod em PostgreSQL local fictício | Bootstrap explícito, reinício com flag desligada, login e refresh 200/cookie rotacionado, health 200, HTTP redirecionado; Swagger/H2 sem acesso público |
| Backup/restore local | pg_dump custom + pg_restore em outro banco vazio; preservadas 19 migrations, entrega com quatro paradas, dois recebimentos e 30 tabelas com RLS |
| Configuração | Compose local/prod, YAML/JSON dos workflows/configurações, shell e git diff sem erros |
| Entry point CA | Escrita do PEM/permissão 600 conferida em caminho sem root simulado; não comprova TLS Supabase |

Os cenários usam contas, endereços e credenciais sintéticos, somente em infraestrutura efêmera local. Startup prod usou Storage local e chave de e-mail fictícia, sem enviar mensagens: ele valida o profile, **não** o Supabase/Resend publicado. O restore local não valida a criptografia age, PITR gerenciado ou a recuperação de objetos remotos.

A validação inicial de 160/40 no documento anterior é histórica; os números acima incluem a revisão atual.

## Estrutura e nomenclatura

Entidades e regras em português (`Entrega`, `ParadaEntrega`, `Recebimento`) são coerentes com o negócio. Componentes e utilitários de infraestrutura em inglês são convencionais; isso não exige renomear todos os contratos na semana de lançamento. Atualizados nomes genéricos visíveis do package web e serviço para `js-boy-web`/`js-boy-api`.

`Usuario` é identidade; `Cliente`/`Entregador` são cadastros operacionais. `Pagamento` registra recebimento/estorno, enquanto `LancamentoRazao` representa outros movimentos. `codigo` é a identificação persistente do serviço; posição da lista não é código. Rota é o conjunto e parada é o local ordenado. Histórico/ocorrência não equivalem a desfazer uma conclusão.

`com.ravtec.delivery`, `DeliveryManagementApplication` e o alias legado `FUNCIONARIO` permanecem por compatibilidade; não são erros funcionais. Não criar contas novas FUNCIONARIO. A documentação e apresentação comercial devem usar JS Boy e os três papéis atuais.

A mistura de prefixos dos endpoints é preexistente: vários usam raiz, outros `/api/pix`. Os serviços web já refletem isso. Não renomear todos os caminhos sem versionamento. O procedimento explica que VITE_API_URL é só a origem da API.

## O que bloqueia o aceite real de produção

| Pendência | Critério para resolver |
| --- | --- |
| Domínio ainda não comprado/configurado | Web/API HTTPS em subdomínios do mesmo domínio-base; refresh após expiração e reload homologados |
| Provedores ainda não conferidos | Railway conectado ao PostgreSQL Supabase com TLS validado; bucket privado e autorização do acervo |
| E-mail/recuperação | Resend/remetente/DNS reais, link correto e recuperação recebida/usada em homologação |
| Gates remotos | CI, auditoria Java, secrets, configurações, migrations e imagens aprovados no mesmo candidato |
| Continuidade | Backup real restaurável em destino isolado; objetos recuperáveis se houver acervo; responsável e RPO/RTO registrados |
| Operação | Três perfis, preço, Pix/dinheiro, saldo/paradas, repetição/rede, estorno e sessão homologados nos hosts finais |
| Histórico existente | Inventário de cobranças Mercado Pago e comprovantes antes de retirar infraestrutura/credenciais legadas |

Nenhuma dessas condições pode ser marcada como concluída a partir dos testes locais. A meta de sábado é viável se a homologação e configuração de sexta fecharem; não publicar com falha de sessão, autorização, saldo ou recuperação de dados.

## Melhorias posteriores e limites do produto

- Listagens completas e bundle grande merecem paginação/carregamento sob demanda conforme volume e medição; não houve benchmark de carga nem aprovação de múltiplas réplicas.
- Limitadores públicos locais pressupõem uma instância. Escalar requer coordenar os limites entre instâncias.
- CSP da Vercel aceita conexões HTTPS de modo amplo; restringir aos hosts finais após conferir dependências.
- O código legível JSB inclui data do servidor e sufixo curto, enquanto datas financeiras já usam fuso do negócio; uniformizar geração sem renomear códigos históricos pode ser uma evolução futura.
- Meu faturamento é volume de serviços, não salário/comissão. Pix direto não confere crédito bancário automaticamente nem transfere valor para a empresa. Conciliação física e políticas de repasse/cobrança de falha/devolução permanecem operacionais.
- A web não oferece fila offline completa, GPS em tempo real, folha de pagamento ou emissão fiscal. Não apresentar essas capacidades como prontas.
- Anonimização do cadastro não apaga automaticamente PII histórica das entregas. Prazos de retenção, atendimento e eliminação do acervo precisam de política definida; a revisão técnica não certifica conformidade jurídica.

## Fontes usadas nas decisões

- [Spring Security: limite BCrypt/advisory](https://spring.io/security/cve-2025-22228/)
- [Avisos de segurança Tomcat 10](https://tomcat.apache.org/security-10.html)
- [Requisitos Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html)
- [Compatibilidade SpringDoc](https://springdoc.org/v2/)
- [Conexão PostgreSQL/Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Proteção da Data API](https://supabase.com/docs/guides/api/securing-your-api)

Os advisories fundamentam a atualização; não foi demonstrada exploração remota das configurações antigas da aplicação. As versões e resultados se referem à revisão datada, não garantem ausência futura de vulnerabilidades.
