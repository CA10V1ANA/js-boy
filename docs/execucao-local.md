# Execução local

## Aplicações do repositório

O repositório contém backend Spring Boot, painel React e uma aplicação Flutter.
A pasta Flutter canônica é `mobile/`, pois contém `lib/`, testes e projetos de
plataforma. A duplicidade de `lib/`, `test/` e `pubspec.yaml` na raiz foi
preservada para não apagar trabalho sem comprovação; CI e novos comandos Flutter
devem usar somente `mobile/` até essa duplicidade ser resolvida.

## Subir com Docker Compose

Requisitos: Docker Engine com Compose v2.

1. Copie `.env.example` para `.env`.
2. Preencha `POSTGRES_PASSWORD`, `JWT_SECRET`, `SEED_OWNER_EMAIL` e
   `SEED_OWNER_PASSWORD` com valores locais próprios.
3. Valide e inicie:

```powershell
Copy-Item -LiteralPath .env.example -Destination .env
docker compose config
docker compose up --build
```

Os campos vazios do exemplo são intencionais e o Compose falha cedo enquanto
eles não forem preenchidos. Não use credenciais de produção nesse arquivo.

Para gerar um segredo JWT local no PowerShell:

```powershell
$jwtBytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($jwtBytes)
[Convert]::ToBase64String($jwtBytes)
```

Serviços padrão:

| Serviço | URL local | Observação |
|---|---|---|
| Painel | `http://localhost:5173` | Nginx não-root |
| API | `http://localhost:8080` | profile `local` |
| Health | `http://localhost:8080/api/health` | sem dados sensíveis |
| Swagger | `http://localhost:8080/swagger-ui/index.html` | somente local |
| PostgreSQL | `localhost:5433` | ligado apenas ao loopback |

O banco persiste no volume `postgres_data`. O Compose não executa reset ou
remoção automática desse volume.

Por padrão, painel e API também ficam ligados ao loopback. Para testar em um
celular físico na mesma rede, altere conscientemente
`BACKEND_BIND_ADDRESS=0.0.0.0`, revise o firewall e use o IP local em
`API_URL`. Essa abertura é apenas para uma rede de desenvolvimento confiável.

## Backend sem Compose

O profile `local` usa H2 em arquivo quando as variáveis de PostgreSQL não são
definidas. Swagger e H2 Console são superfícies de desenvolvimento.

```powershell
Set-Location backend
$env:SPRING_PROFILES_ACTIVE = "local"
$env:JWT_SECRET = "<segredo-local-com-32-ou-mais-caracteres>"
$env:SEED_OWNER_EMAIL = "<email-local-escolhido>"
$env:SEED_OWNER_PASSWORD = "<senha-local-forte>"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5173"
mvn spring-boot:run
```

O diretório `backend/data/` é local e ignorado pelo Git. Não existe usuário ou
senha de seed embutido.

## Painel

```powershell
Set-Location frontend
npm ci
npm test
npm run build
npm run dev
```

`VITE_API_URL` pode apontar para a API local. Dados comerciais
`VITE_BUSINESS_*` vazios não devem gerar telefone, endereço ou links fictícios.

## Flutter canônico

```powershell
Set-Location mobile
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=API_URL=http://10.0.2.2:8080
```

HTTP é permitido somente em builds/debug de desenvolvimento. Builds de release
devem receber uma `API_URL` HTTPS e não devem habilitar tráfego em claro no
manifest principal.

## Testes do backend

O profile `test` usa configuração isolada, sem seed e sem Swagger/H2 Console. Os
testes de integração que usam Testcontainers substituem a conexão H2 pelo
PostgreSQL temporário.

```powershell
Set-Location backend
$env:SPRING_PROFILES_ACTIVE = "test"
mvn clean verify
```

## Produção

Este Compose não é um arquivo de deploy. Em produção, no mínimo:

- `SPRING_PROFILES_ACTIVE=prod`;
- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e
  `SPRING_DATASOURCE_PASSWORD`;
- `JWT_SECRET` forte e obtido de um gerenciador de segredos;
- `CORS_ALLOWED_ORIGINS` apenas com origens HTTPS autorizadas;
- reverse proxy controlado encerrando TLS e encaminhando o protocolo;
- backend acessível somente pela rede privada do proxy.

O profile `prod` desabilita Swagger e H2 Console, exige HTTPS na camada de
segurança e é o único que respeita cabeçalhos encaminhados.
