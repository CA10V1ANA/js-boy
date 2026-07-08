# JS Boy - MVP do Sistema de Entregas

MVP de uma aplicacao web para a JS Boy organizar clientes, entregadores, entregas, pagamentos, status e valores.

O projeto foi pensado para rodar de forma simples no notebook, com PostgreSQL isolado na porta `5433` para nao mexer em outros bancos da maquina.

## Tecnologias

Backend:

- Java 21
- Spring Boot 3
- Spring Web
- Spring Data JPA
- Spring Security
- JWT
- Flyway
- PostgreSQL
- Swagger/OpenAPI
- Maven

Frontend:

- React
- TypeScript
- Vite
- React Router
- React Hook Form + Zod (validacao de formularios)
- Axios (com interceptor global de erros)
- Lucide React
- CSS responsivo

Testes:

- JUnit 5 + Mockito (testes unitarios do backend)
- Testcontainers (testes de integracao com PostgreSQL real)
- Vitest + React Testing Library (frontend)

## Estrutura

```text
backend/
  src/main/java/com/ravtec/delivery/
    config/
    controller/
    dto/
    entity/
    exception/
    mapper/
    repository/
    security/
    service/
  src/main/resources/db/migration/
  src/test/java/com/ravtec/delivery/
    controller/   (testes de integracao *IT com Testcontainers)
    service/      (testes unitarios com Mockito)

frontend/
  src/
    components/
    contexts/
    layouts/
    pages/        (paginas e seus testes *.test.tsx)
    routes/
    schemas/      (validacao com Zod)
    services/
    test/         (setup do Vitest)
    types/
```

Variaveis de ambiente estao documentadas em `.env.example` na raiz do projeto.

## Banco de dados

Configuracao padrao do PostgreSQL:

```text
Host: localhost
Porta: 5433
Database: delivery_app
Usuario: delivery_user
Senha: delivery_pass
```

As migrations ficam em:

```text
backend/src/main/resources/db/migration/
```

Migrations atuais:

- `V1__create_initial_schema.sql`: usuarios, clientes, entregadores, entregas, historico e configuracao de preco.
- `V2__create_pagamentos.sql`: pagamentos.
- `V3__add_entregador_usuario_unique.sql`: vinculo unico entre entregador e usuario.

## Como rodar

### Opcao 1: Docker Compose (recomendado)

Sobe PostgreSQL, backend e frontend com um comando so:

```bash
docker compose up --build
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/api/health`

### Opcao 2: Rodando localmente

Backend (requer PostgreSQL na porta `5433`, ver secao "Banco de dados"):

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

URLs identicas as da opcao com Docker.

## Login inicial

O backend cria automaticamente um usuario proprietario inicial:

```text
E-mail: proprietario@jsboy.com
Senha: admin123
Perfil: PROPRIETARIO
```

## Funcionalidades implementadas

Fase 1 - Planejamento e estrutura:

- Projeto backend Spring Boot.
- Projeto frontend React/Vite.
- PostgreSQL configurado por ambiente.
- Docker Compose preparado.
- README.
- Entidades principais.

Fase 2 - Autenticacao:

- Login com JWT.
- Spring Security.
- Perfis `PROPRIETARIO` e `ENTREGADOR`.
- Rotas protegidas no frontend.
- Usuario proprietario inicial.

Fase 3 - Cadastros:

- Clientes.
- Entregadores.
- Criacao de acesso para entregador.
- Ativacao/desativacao.
- Disponibilidade do entregador.

Fase 4 - Entregas:

- Criacao.
- Consulta.
- Edicao.
- Mudanca de status.
- Historico.
- Designacao de entregador.
- Tela "Minhas entregas" para entregador.

Fase 5 - Rotas e precos:

- Configuracao de taxa inicial, valor por km e valor minimo.
- Simulacao de valor por distancia.
- Calculo automatico no cadastro da entrega.

Fase 6 - Pagamentos:

- Registro de pagamentos.
- Comprovante como texto/link/codigo.
- Valores pendentes.
- Relatorio financeiro basico.

Fase 7 - Dashboards:

- Dashboard do proprietario.
- Area operacional do entregador.

Fase 8 - Testes, observabilidade e producao:

- Testes unitarios de backend (JUnit 5 + Mockito) cobrindo as regras de
  negocio de clientes, entregas e calculo de precos.
- Testes de integracao (Testcontainers + PostgreSQL) para autenticacao
  e CRUD de clientes, subindo o banco real via Docker.
- Testes de frontend (Vitest + React Testing Library) para validacao
  de formularios e fluxo de login.
- Validacao de formularios no frontend com React Hook Form + Zod.
- `GlobalExceptionHandler` padronizado (`timestamp`, `status`, `error`,
  `message`, `path`), com tratamento de autenticacao, acesso negado e
  erros inesperados.
- Interceptor global do Axios com notificacoes toast para erros de API.
- Logging estruturado (SLF4J) em login, criacao/edicao de registros e
  mudancas de status.
- Docker Compose corrigido (fallback de SPA no nginx, variaveis de
  build do Vite, healthchecks).
- Revisao do Swagger.
- Revisao de seguranca.
- Revisao da interface.

## Endpoints principais

Autenticacao:

- `POST /auth/login`

Clientes:

- `GET /clientes`
- `POST /clientes`
- `PUT /clientes/{id}`
- `PATCH /clientes/{id}/status`

Entregadores:

- `GET /entregadores`
- `POST /entregadores`
- `PUT /entregadores/{id}`
- `PATCH /entregadores/{id}/status`
- `POST /entregadores/{id}/acesso`

Entregas:

- `GET /entregas`
- `POST /entregas`
- `PUT /entregas/{id}`
- `PATCH /entregas/{id}/status`
- `PATCH /entregas/{id}/entregador`
- `GET /entregas/minhas-entregas`
- `PATCH /entregas/minhas-entregas/{id}/status`

Precos:

- `GET /configuracoes/preco`
- `PUT /configuracoes/preco`
- `POST /configuracoes/preco/simular`

Pagamentos:

- `GET /pagamentos`
- `POST /pagamentos`
- `GET /pagamentos/relatorio`
- `GET /pagamentos/entrega/{entregaId}`

Dashboard:

- `GET /dashboard/resumo`

## Testes

Backend (testes unitarios):

```bash
cd backend
mvn test
```

Backend (testes de integracao com Testcontainers, requer Docker rodando):

```bash
cd backend
mvn verify
```

Frontend:

```bash
cd frontend
npm test
```

## Comandos de validacao manual

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
mvn -DskipTests compile
```

## Proximas melhorias

- Integracao real com mapas para distancia e tempo.
- Upload real de comprovantes.
- Relatorios em PDF/Excel.
- Perfil `OPERADOR`, caso a empresa precise separar atendimento do proprietario.
- Notificacoes por WhatsApp.
- Auditoria mais detalhada de alteracoes.
