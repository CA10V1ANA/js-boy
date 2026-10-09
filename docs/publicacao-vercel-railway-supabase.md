# Publicação: Vercel + Railway + Supabase

Procedimento revisado em 08/10/2026 (Fortaleza). A configuração dos provedores reais ainda não foi executada nesta revisão. Use o mesmo commit aprovado na homologação e na produção. Os exemplos não contêm credenciais reais.

## 1. Endereços e ambientes

Compre o domínio e conecte subdomínios ao frontend e à API. Exemplo:

| Ambiente | Web na Vercel | API na Railway | Dados |
| --- | --- | --- | --- |
| Homologação | `https://homolog.seudominio.com.br` | `https://api-homolog.seudominio.com.br` | Supabase separado, dados fictícios |
| Produção | `https://app.seudominio.com.br` | `https://api.seudominio.com.br` | Supabase de produção |

Esses nomes são exemplos. Frontend e API devem compartilhar o domínio-base e usar HTTPS. O cookie de renovação é Secure, HttpOnly e SameSite=Strict: endereços gratuitos em `vercel.app` e `railway.app` pertencem a sites diferentes e prejudicam a renovação. CORS sozinho não resolve. Um domínio próprio é um endereço comprado por você; os subdomínios apontam cada aplicação para seu provedor.

Use JWT, banco, bucket e credenciais distintos por ambiente. Desabilite promoções automáticas para produção até concluir os gates e a homologação. Não troque o candidato depois do aceite sem repetir a validação afetada.

## 2. PostgreSQL e Storage no Supabase

Crie projetos isolados. A aplicação usa JDBC e autenticação própria; não utiliza Supabase Auth nem acesso direto à Data API pelo navegador.

Para conexão persistente Spring/Flyway, copie do painel a conexão **direta** na porta 5432 se o ambiente suportar sua conectividade, ou o **session pooler** na porta 5432 para IPv4. Não use o transaction pooler 6543 como configuração padrão deste backend. Host, usuário, região e certificados vêm do painel, não devem ser deduzidos.

Configure TLS com validação de host/certificado. O modelo [Railway/Supabase](../ops/railway-supabase.env.example) usa `sslmode=verify-full` e um CA público em `DB_SSL_ROOT_CERT_PEM`; o entrypoint Docker escreve `/tmp/jsboy-db-root.crt`. O PEM precisa conter quebras de linha reais. Teste a conexão com essa configuração, sem desabilitar a verificação TLS para contornar erro. Comece com pool máximo 8 e uma instância; confira o limite do plano.

Flyway é a única fonte das migrations de negócio. Em banco novo ele aplica V1–V19. Em banco existente, registre histórico e faça backup verificável antes de subir. Não use `clean`, `repair` ou `baseline` para esconder inconsistências. Não edite migrations aplicadas.

V19 ativa RLS e revoga acesso de `PUBLIC`, `anon` e `authenticated` às tabelas de negócio. A API deve conectar com o papel proprietário das tabelas. Não há FORCE RLS; proprietário e papéis administrativos continuam com poderes previstos pelo PostgreSQL. Um papel JDBC diferente exige projeto explícito de grants/policies. Os default privileges da migration valem para o papel que a executa; revisar se o criador de tabelas mudar. Como a aplicação não precisa de REST/GraphQL do Supabase, **desabilite a Data API** no painel. Não habilite grants/policies públicas para resolver falhas da API Spring.

Crie bucket **privado**, copie endpoint S3/região e gere credenciais exclusivamente para o backend. Configure as variáveis `SUPABASE_STORAGE_*` do modelo. Nenhuma chave S3/service-role, senha PostgreSQL ou JWT vai para `VITE_*`. O adaptador mantém downloads antigos autorizados pela API; fotos/OTP não integram a operação atual. Em banco com acervo, confira que cada registro aponta para bytes existentes. Backup do banco não copia esses objetos.

## 3. API na Railway

Conecte o repositório, Root Directory `/backend`, configuração `/backend/railway.json` e build Dockerfile/Java 21. Confira o caminho efetivo do arquivo nas opções do monorepo. O healthcheck é `/api/health`, com timeout 300 segundos. A aplicação aceita `PORT`; use 8080 para coincidir com o healthcheck interno do Docker e configure o domínio para essa porta. Não exponha a porta de gestão 9090 publicamente.

Use [ops/railway-supabase.env.example](../ops/railway-supabase.env.example) como lista de nomes, preenchendo valores reais somente nas variáveis protegidas da plataforma. Principais grupos:

| Grupo | Configuração |
| --- | --- |
| Ambiente | `SPRING_PROFILES_ACTIVE=staging` ou `prod`, `PORT=8080`, `BUSINESS_TIME_ZONE=America/Fortaleza` |
| Banco | `SPRING_DATASOURCE_URL`, usuário/senha, CA, pool |
| Sessão | `JWT_SECRET` aleatório de alta entropia, pelo menos 32 caracteres; segredo diferente por ambiente |
| Navegador | `CORS_ALLOWED_ORIGINS` com origem HTTPS exata; `PUBLIC_FRONTEND_URL` com o frontend do ambiente |
| Arquivos | `APP_STORAGE_PROVIDER=supabase-s3` e credenciais S3 privadas |
| E-mail | `APP_NOTIFICATIONS_PROVIDER=resend`, `APP_PASSWORD_RESET_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM` |
| Fluxo atual | `APP_PROOF_OTP_PROVIDER=disabled`; nenhuma credencial Twilio é obrigatória |

Cadastre/valide o remetente no Resend e os registros DNS exigidos. A API recusa iniciar com provedor Resend escolhido e chave/remetente vazios. O provedor `local` não entrega recuperação de senha por e-mail; não serve para provar o fluxo público. Envie uma recuperação real para uma conta de homologação e confira URL, entrega e uso único. Não registrar tokens nos logs.

Em um banco **novo e vazio**, ative `APP_BOOTSTRAP_OWNER_ENABLED=true` uma única vez, com `SEED_OWNER_EMAIL` e senha de pelo menos 12 caracteres e no máximo 72 bytes UTF-8. O bootstrap funciona em staging/prod com ativação explícita, recusa população conflitante e não substitui usuários existentes. Após validar o login inicial, desligue a flag e remova as variáveis de seed. Em banco já utilizado, preserve a conta e o procedimento de recuperação; não force reinicialização.

Mercado Pago só necessita credenciais se o banco contiver cobranças antigas para conciliar. Faça esse inventário antes de retirar credenciais/webhooks de um ambiente existente. Não são necessárias em banco novo sem cobranças.

## 4. Frontend na Vercel

Root Directory `frontend`, preset Vite, Node.js **22** com versão compatível (mínimo 22.12), instalação `npm ci`, build `npm run build`, saída `dist`. A versão alternativa suportada é Node 20.19+; Node 18 não atende Vite 8. O `vercel.json` define rotas SPA e cabeçalhos.

Configure [ops/vercel.env.example](../ops/vercel.env.example). `VITE_API_URL` é a URL HTTPS da API, sem acrescentar `/api`: os serviços já definem seus caminhos. `VITE_BUSINESS_*` são contatos públicos da empresa; não são segredos. Valores VITE entram no build: mudar variável requer novo build.

Use variáveis separadas para homologação e produção. Preview automático em outro domínio não substitui o teste no domínio de homologação previsto. Confira contatos, WhatsApp, política de privacidade, rotas diretas `/login`, `/portal` e `/minhas-entregas`, favicon e headers na publicação real. A CSP atual aceita conexões HTTPS; sua restrição ao domínio final pode ser planejada após estabilizar os hosts.

## 5. Aceite de homologação

Execute com dados fictícios e três contas vinculadas:

1. Login/logout/reload; renovação depois de expirar o JWT; recuperação de senha real; conta desativada e UUID de recurso alheio negados.
2. Cliente solicita entrega, vê apenas seus serviços e não consegue confirmar recebimento ou finalizar por chamada direta.
3. Proprietário aprova preço, inclusive orçamento pendente, cria rota com vários locais e designa entregador.
4. Entregador conclui paradas na ordem, registra ocorrência válida e só opera suas entregas.
5. Pix mostra o recebedor correto; dinheiro não mostra chave. Conferência parcial mantém saldo e bloqueia ENTREGUE; quitação e todas as paradas liberam a finalização.
6. Resposta perdida após o crédito e reload: **Conferir tentativa anterior** não duplica lançamento. Estorno altera saldo; zero explícito conserva exigências operacionais.
7. Histórico/relatórios/competência, links de rastreamento e contatos corretos; telas em celular sem overflow.
8. TLS, cookie/CORS, banco, bucket privado e leitura autorizada do acervo, e-mail, health e logs no provedor real.
9. Backup e restauração do banco em destino isolado; backup/restauração dos objetos quando há acervo; alertas e contato de plantão.

Registre commit, ambiente, cenário, resultado e evidência sem dados sensíveis. Rodar só o build não cumpre essa homologação.

## 6. Gates, promoção e rollback

Execute CI web/API e Security gates no commit candidato: testes, auditorias Java/web, secrets, configurações, migrations e imagens. O workflow manual `Prepare release` exige qualidade **e** segurança; prepara artefatos/manifesto sem efetuar deploy. As análises OWASP/Trivy/Gitleaks e os builds Docker ainda precisam de resultado remoto; npm audit local zero não os substitui. Configure `PUBLIC_API_URL` no ambiente GitHub caso utilize o pacote web desse workflow.

GitHub Actions não publica automaticamente esta topologia. Vercel/Railway devem promover o mesmo commit aprovado; confira associações de projeto/branch e variáveis, evitando auto-deploy de uma versão diferente. A liberação de produção deve ocorrer somente após o aceite.

Antes de promover: backup verificável, migrations revisadas, domínios/segredos corretos, bootstrap desligado, responsáveis definidos. Após promover: health, três perfis, sessão, recebimento, logs e notificações. Monitore saldo, erros e outbox. Não altere preços ou dados reais apenas para executar um teste sem combinar com a operação.

Rollback preferencial é voltar o artefato de aplicação, verificando compatibilidade com migrations e lançamentos produzidos. Não desfazer banco automaticamente. Restore com dados reais exige decisão de incidente e avaliação das transações posteriores ao backup; pode perder dados. Registre RPO/RTO e o ponto de retorno.

## 7. Sequência até sábado, 10/10/2026

| Quando | Entrega |
| --- | --- |
| Quinta 08/10 | Correções locais, revisão e documentação; escolher domínio e projetos dos ambientes |
| Sexta 09/10 | Configurar HTTPS, Supabase e Resend; rodar gates no candidato e homologar integralmente; ensaiar recuperação |
| Sábado 10/10 | Promover o candidato aprovado, conferir smoke tests e acompanhar operação; adiar produção se restar bloqueador de sessão, pagamento, autorização ou recuperação |

A meta de sábado depende dos resultados reais de sexta. Consulte [a revisão](revisao-completa-2026-10-08.md) para separar evidências já obtidas das verificações externas pendentes.

## Referências

- [Conexões PostgreSQL/Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Backup e restauração da JS Boy](backup-restauracao.md)
- [Segurança de sessão](seguranca-sessao.md)
