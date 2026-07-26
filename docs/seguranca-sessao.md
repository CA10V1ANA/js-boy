# Segurança de sessão

## Estado do P0

A autenticação usa um access token JWT assinado pelo backend. O token padrão
expira em 15 minutos; o valor pode ser reduzido por ambiente com
`JWT_EXPIRATION_MINUTES`. Não existe segredo padrão: `JWT_SECRET` é obrigatório
fora do profile de teste e deve ter alta entropia e pelo menos 32 caracteres.

O token identifica o usuário, mas autorização não depende apenas do papel
contido nele. O backend consulta o usuário e seus vínculos com `Cliente` ou
`Entregador` e aplica a matriz descrita em
[`matriz-permissoes.md`](matriz-permissoes.md).

## Armazenamento atual

- Mobile: o token deve permanecer no armazenamento seguro do sistema
  (Keystore/Keychain).
- Web: o token permanece temporariamente no `localStorage`. Isso o torna
  acessível a JavaScript executado na mesma origem e, portanto, vulnerável a
  roubo em caso de XSS.

Como mitigação temporária, o servidor estático aplica CSP, bloqueio de framing,
`nosniff`, política de referência e política restritiva de permissões. A
aplicação também deve evitar HTML não confiável, scripts de terceiros e logs de
token. Essas medidas reduzem o risco, mas não equivalem a um cookie HttpOnly.

## Tarefa técnica obrigatória

Uma etapa posterior deve implementar sessão completa, de maneira coordenada:

1. refresh token rotativo, revogável e armazenado com segurança;
2. access token curto sem persistência duradoura no navegador;
3. logout com revogação;
4. recuperação de senha com token aleatório, expirável e de uso único;
5. proteção CSRF adequada caso a autenticação passe a usar cookies.

Não se deve migrar isoladamente para cookies antes de esse fluxo estar
projetado e testado.

## Ambientes e superfícies de desenvolvimento

| Profile | Swagger | H2 Console | CORS | HTTPS |
|---|---|---|---|---|
| `local` | configurável, habilitado por padrão | configurável; Compose o desabilita | origens locais explícitas | não exigido |
| `test` | desabilitado | desabilitado | origem de teste | não exigido |
| `prod` | desabilitado | desabilitado | variável obrigatória, sem wildcard | exigido |

O profile `prod` processa cabeçalhos encaminhados porque deve operar atrás de um
reverse proxy controlado. O proxy encerra TLS, remove cabeçalhos encaminhados
recebidos do público e define `X-Forwarded-Proto=https`. A porta do backend não
deve ficar exposta diretamente à internet. Profiles local e test ignoram esses
cabeçalhos.

## CORS

`CORS_ALLOWED_ORIGINS` recebe uma lista separada por vírgulas de origens
completas, incluindo esquema e porta. Em produção:

- usar somente origens HTTPS conhecidas;
- não usar `*` quando credenciais estiverem habilitadas;
- não incluir barra final ou caminho;
- revisar a lista ao trocar domínio.

CORS não substitui autenticação e não protege clientes que não sejam
navegadores.

## Credenciais de desenvolvimento

O seed existe somente no profile `local` e exige `SEED_OWNER_EMAIL` e
`SEED_OWNER_PASSWORD`. Não há e-mail ou senha preenchidos no repositório. O
profile `prod` não carrega o inicializador local.

O arquivo `.env.example` contém apenas nomes de variáveis e valores públicos
locais. O `.env` preenchido é ignorado pelo Git. Segredos de produção devem vir
de um gerenciador de segredos da plataforma, nunca de Compose ou da imagem.

## Respostas e logs

- `401`: credencial ausente, inválida ou expirada;
- `403`: usuário autenticado não pode executar a ação;
- `404`: recurso inexistente ou fora do escopo do usuário, quando revelar a
  existência criaria enumeração;
- tokens, senhas, segredos, documentos e dados pessoais completos não podem ser
  registrados;
- logout local deve apagar token e dados de usuário do armazenamento;
- qualquer `401` em revalidação deve encerrar a sessão local.
