# Segurança de sessão

Estado revisado em 08/10/2026. O backend é a autoridade dos papéis e vínculos; veja [matriz de permissões](matriz-permissoes.md).

## Login, armazenamento e renovação

O access token JWT dura 15 minutos por padrão (`JWT_EXPIRATION_MINUTES`) e fica somente em memória. `JWT_SECRET` não tem segredo padrão e exige alta entropia e pelo menos 32 caracteres fora de teste. O filtro recarrega identidade e vínculo; usuário removido/renomeado não causa erro 500 nem conserva autorização pelo JWT antigo.

Refresh token fica no cookie `refresh_token`, HttpOnly, Secure, SameSite=Strict, path `/auth`. O banco guarda hash; cada renovação rotaciona o token e reutilização revoga sua família. Logout revoga a renovação. O corpo do login não entrega refresh token ao JavaScript.

O frontend consulta `/auth/me`, renova em resposta 401 quando permitido e encerra a sessão quando a renovação falha. Usa coordenação da tentativa de refresh dentro da página. O reload restaura a sessão pelo cookie. `localStorage` conserva dados mínimos da conta e tentativas financeiras idempotentes, sem o token de acesso. Logout apaga esses dados e tentativas locais.

Frontend e API em HTTPS no mesmo domínio-base são requisito da topologia atual. `app.exemplo.com.br` e `api.exemplo.com.br` são sites compatíveis com SameSite=Strict; URLs independentes `vercel.app`/`railway.app` não são. Não reduzir o atributo do cookie como atalho. Veja [publicação](publicacao-vercel-railway-supabase.md).

## Senha e recuperação

BCrypt guarda hash da senha. Senhas novas/reset/bootstrap exigem 12 caracteres e limite de 72 **bytes UTF-8**; acentos podem consumir mais de um byte. Login conserva compatibilidade com senhas antigas menores e valida o limite antes do BCrypt.

Recuperação usa token aleatório, hash, expiração e uso único; resposta de solicitação não revela se a conta existe. Há limites por origem/conta. O provedor local não envia e-mail. Em staging/prod, configurar Resend e testar entrega/URL real. Redefinição e desativação revogam renovação; autorização de identidade/vínculo continua sendo conferida no servidor.

## Superfícies e CORS

| Profile | Swagger/H2 | HTTPS | Bootstrap do proprietário |
| --- | --- | --- | --- |
| local | Configurável; apenas desenvolvimento | Não exigido | Conforme configuração local |
| test | Desabilitados | Não exigido | Fixtures de teste |
| staging | Desabilitados | Exigido por padrão | Somente ativação explícita em banco inicial |
| prod | Desabilitados | Exigido | Somente ativação explícita em banco inicial |

Staging/prod usam cabeçalhos encaminhados pelo proxy. Somente o ingresso confiável deve alcançar a API, com `X-Forwarded-Proto` correto. Não exponha diretamente portas internas ou gestão. Homologue essa configuração no Railway.

CORS aceita origens completas explícitas (`https://app.exemplo.com.br`), sem caminho, barra final ou wildcard de credenciais. Origem permitida não concede papel nem posse. CSP, framing, nosniff e política de referência são camadas complementares; não eliminam riscos de XSS.

## Bootstrap e respostas

`APP_BOOTSTRAP_OWNER_ENABLED` é false por padrão em staging/prod. A ativação exige e-mail/senha, verifica população do banco e é idempotente para o proprietário compatível; não substitui contas existentes. Desligar após o primeiro acesso e remover SEED_* da configuração protegida. Nunca versionar credenciais.

- 401: identidade ausente, inválida ou expirada; a web pode tentar renovação antes de encerrar.
- 403: papel autenticado não pode executar a ação.
- 404: recurso inexistente ou fora do escopo quando a existência deve ser protegida.
- 409: versão/estado/conciliação em conflito; atualizar e conferir, sem sobrescrever à força.

Logs e evidências não devem conter senhas, tokens, chaves privadas ou dados pessoais completos. Segredos pertencem às variáveis protegidas dos provedores. O Supabase não substitui a autorização Spring; tabelas de negócio devem permanecer inacessíveis a anon/authenticated pela Data API.
