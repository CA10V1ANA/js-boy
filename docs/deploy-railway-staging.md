# Deploy de homologação no Railway

> **Registro histórico.** Para o estado atual, consulte [a revisão de 08/10](revisao-completa-2026-10-08.md) e [o procedimento Vercel/Railway/Supabase](publicacao-vercel-railway-supabase.md). Resultados e pendências abaixo se referem à execução anterior. Não são o checklist vigente de publicação.

> **Topologia anterior.** Este runbook inclui frontend e PostgreSQL na Railway
> e comprovantes em volume local. Para a decisão atual (web na Vercel, API na
> Railway, PostgreSQL e arquivos no Supabase), consulte
> [arquitetura web + API](arquitetura-web-api.md). Não aplique as etapas abaixo
> ao novo ambiente sem revisão.

Este runbook publica o painel React, a API Spring Boot, o PostgreSQL e o volume de comprovantes em um ambiente isolado de homologação. Ele não deve compartilhar banco, domínio ou segredos com produção.

## Pré-requisitos

- repositório atualizado no GitHub;
- conta Railway conectada ao GitHub;
- CI da branch sem falhas;
- e-mail e senha inicial do proprietário definidos pelo responsável;
- nenhum dado real de cliente durante a primeira rodada de testes.

## Arquitetura

~~~text
Internet -> frontend (Nginx/React)
                  |
                  v HTTPS
             backend (Spring Boot) -> Postgres
                  |
                  v
          volume /var/lib/jsboy
~~~

Somente frontend e backend recebem domínio público. PostgreSQL, volume e porta de gestão não recebem exposição pública.

## 1. Criar o projeto e os serviços

1. No Railway, crie um projeto vazio chamado js-boy-homologacao.
2. Adicione um PostgreSQL e mantenha o nome do serviço como Postgres.
3. Crie dois serviços vazios chamados exatamente backend e frontend.
4. Gere um domínio Railway para backend e outro para frontend.
5. Conecte os dois serviços ao mesmo repositório GitHub e à branch de homologação escolhida.

As referências no formato ${{servico.VARIAVEL}} dependem dos nomes dos serviços. Se um nome for alterado, atualize as referências.

## 2. Configurar o backend

No serviço backend:

- Root Directory: /backend
- Config File Path: /backend/railway.json
- domínio público: habilitado
- volume: montado em /var/lib/jsboy

Importe as variáveis de [railway-staging-backend.env.example](../ops/railway-staging-backend.env.example). Preencha manualmente:

- JWT_SECRET: segredo aleatório com pelo menos 32 bytes;
- SEED_OWNER_EMAIL: e-mail inicial do proprietário;
- SEED_OWNER_PASSWORD: senha temporária forte, com pelo menos 12 caracteres.

Marque JWT_SECRET, SEED_OWNER_EMAIL e SEED_OWNER_PASSWORD como sealed.

Para gerar o JWT no PowerShell:

~~~powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
~~~

O container inicia como root apenas para corrigir a propriedade do volume Railway e imediatamente executa a JVM como jsboy, UID/GID 10001.

## 3. Configurar o frontend

No serviço frontend:

- Root Directory: /frontend
- Config File Path: /frontend/railway.json
- domínio público: habilitado
- nenhum volume

Importe as variáveis de [railway-staging-frontend.env.example](../ops/railway-staging-frontend.env.example).

VITE_API_URL é incorporada ao bundle durante o build. Toda mudança dessa variável exige novo deploy do frontend.

## 4. Primeiro deploy e bootstrap

1. Aplique as configurações do PostgreSQL e aguarde o serviço ficar saudável.
2. Faça deploy do backend.
3. Confirme https://DOMINIO-BACKEND/api/health.
4. Nos logs, confirme security_event=owner_bootstrap result=created.
5. Faça deploy do frontend.
6. Entre usando as credenciais temporárias.
7. Troque a senha do proprietário se o produto oferecer esse fluxo; caso contrário, trate a senha inicial como segredo definitivo até o fluxo ser implementado.
8. No backend, defina APP_BOOTSTRAP_OWNER_ENABLED=false.
9. Remova SEED_OWNER_EMAIL e SEED_OWNER_PASSWORD.
10. Faça novo deploy e confirme que login e health check continuam funcionando.

O bootstrap recusa criar um proprietário quando o banco já contém outros usuários, é idempotente para o mesmo proprietário e nunca é carregado no perfil prod.

## 5. Limitações deliberadas da homologação

A configuração inicial usa provedores locais:

- OTP de comprovante aparece somente no log mascarado do ambiente;
- notificações são registradas no log;
- recuperação de senha não envia e-mail;
- comprovantes ficam no volume Railway.

Esses provedores permitem testes funcionais, mas devem ser substituídos antes de produção. Não conceda acesso aos logs a pessoas externas.

## 6. Smoke test obrigatório

- [ ] /api/health retorna 200;
- [ ] /healthz do frontend retorna 200;
- [ ] login do proprietário funciona;
- [ ] página recarregada em rota interna não retorna 404;
- [ ] cliente e entregador podem ser cadastrados;
- [ ] entrega pode ser criada, designada e avançada;
- [ ] pagamento pode ser criado e estornado no cenário de teste;
- [ ] rastreamento público funciona sem autenticação;
- [ ] comprovante continua disponível depois de redeploy do backend;
- [ ] CORS rejeita origem diferente do frontend;
- [ ] Swagger e H2 Console não estão expostos;
- [ ] banco não possui domínio ou porta pública;
- [ ] variáveis SEED_* foram removidas após o bootstrap.

## 7. Rollback e dados

Para falha somente de aplicação, use o rollback do deployment Railway. Não reverta migrations destrutivamente. Antes de qualquer teste com dados importantes, configure backup do PostgreSQL e do volume.

O trial do Railway não deve ser tratado como armazenamento definitivo. Exporte os dados necessários antes de encerrar ou deixar expirar o projeto.
