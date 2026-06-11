# JS Boy - MVP do Sistema de Entregas

MVP de uma aplicacao web para organizar clientes, entregadores, entregas, status e valores da JS Boy.

O objetivo desta primeira versao e manter o sistema simples, funcional e facil de evoluir. Funcionalidades avancadas como pagamento online, PIX, rastreamento em tempo real, notificacoes automaticas e relatorios em PDF/Excel ficam para fases futuras.

## Tecnologias

Backend:

- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- JWT
- Bean Validation
- Maven
- Flyway
- PostgreSQL
- Swagger/OpenAPI

Frontend:

- React
- TypeScript
- Vite
- React Router
- Axios
- HTML
- CSS responsivo

Infra:

- Docker Compose opcional para subir somente os servicos do projeto
- PostgreSQL isolado na porta local `5433`

## Arquitetura

```text
.
├── backend/
│   ├── src/main/java/com/ravtec/delivery/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── mapper/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   └── src/main/resources/db/migration/
├── frontend/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── utils/
├── docker-compose.yml
└── .env.example
```

## Entidades do MVP

- `Usuario`: login, senha protegida, perfil e vinculo opcional com entregador.
- `Cliente`: dados de contato, endereco e situacao ativa/inativa.
- `Entregador`: dados pessoais, veiculo, disponibilidade e usuario associado.
- `Entrega`: cliente, origem, destino, distancia, valores, entregador e status.
- `HistoricoEntrega`: registros de alteracao de status.
- `ConfiguracaoPreco`: taxa inicial, valor por km e valor minimo.

Relacionamentos principais:

- Um cliente pode possuir varias entregas.
- Um entregador pode possuir varias entregas.
- Uma entrega pertence a um cliente.
- Uma entrega pode possuir um entregador.
- Uma entrega possui varios registros de historico.
- Um usuario pode estar associado a um entregador.

## Status das entregas

- `SOLICITADA`
- `CONFIRMADA`
- `AGUARDANDO_ENTREGADOR`
- `ENTREGADOR_DESIGNADO`
- `COLETADA`
- `EM_ROTA`
- `ENTREGUE`
- `CANCELADA`

## Endpoints planejados

Autenticacao:

- `POST /auth/login`

Clientes:

- `GET /clientes`
- `GET /clientes/{id}`
- `POST /clientes`
- `PUT /clientes/{id}`
- `PATCH /clientes/{id}/status`

Entregadores:

- `GET /entregadores`
- `GET /entregadores/{id}`
- `POST /entregadores`
- `PUT /entregadores/{id}`
- `PATCH /entregadores/{id}/status`

Entregas:

- `GET /entregas`
- `GET /entregas/{id}`
- `POST /entregas`
- `PUT /entregas/{id}`
- `PATCH /entregas/{id}/status`
- `PATCH /entregas/{id}/entregador`
- `GET /entregas/minhas-entregas`

Dashboard:

- `GET /dashboard/resumo`

Configuracao de preco:

- `GET /configuracoes/preco`
- `PUT /configuracoes/preco`

Endpoint ja criado na Etapa 1:

- `GET /api/health`

## Banco de dados

O projeto usa PostgreSQL. Para evitar conflito com bancos existentes na maquina, o Docker Compose expoe o banco deste projeto em:

```text
localhost:5433
```

Configuracao padrao:

- Database: `delivery_app`
- Usuario: `delivery_user`
- Senha: `delivery_pass`
- Porta local: `5433`

As tabelas iniciais sao criadas por Flyway em:

```text
backend/src/main/resources/db/migration/V1__create_initial_schema.sql
```

## Variaveis de ambiente

Copie `.env.example` para `.env` se for usar Docker Compose.

```env
POSTGRES_DB=delivery_app
POSTGRES_USER=delivery_user
POSTGRES_PASSWORD=delivery_pass
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/delivery_app
SPRING_DATASOURCE_USERNAME=delivery_user
SPRING_DATASOURCE_PASSWORD=delivery_pass
JWT_SECRET=change-me-with-a-long-random-secret
```

## Como executar

Backend com Maven:

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

Docker Compose, quando Docker Desktop estiver disponivel:

```bash
docker compose up --build
```

Servicos esperados:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL do projeto: `localhost:5433`
- Swagger: `http://localhost:8080/swagger-ui/index.html`

## Credenciais iniciais

O sistema cria automaticamente um usuario proprietario inicial ao iniciar o backend:

```text
E-mail: proprietario@jsboy.com
Senha: admin123
Perfil: PROPRIETARIO
```

Essas credenciais sao apenas para desenvolvimento. Troque a senha antes de qualquer uso real.

## Etapas do projeto

### Etapa 1 - Estrutura inicial

Status: em andamento/concluida nesta base.

- Criar front-end.
- Criar back-end.
- Configurar banco.
- Criar entidades.
- Criar migracoes.
- Criar README.
- Preparar estrutura de pastas.

### Etapa 2 - Login e seguranca

Status: em andamento/concluida na base atual.

- Criar usuario proprietario inicial.
- Implementar JWT.
- Implementar BCrypt.
- Criar tela de login funcional.
- Proteger rotas.
- Controlar acesso por perfil.

### Etapa 3 - Clientes e entregadores

- Cadastro.
- Consulta.
- Edicao.
- Desativacao.

### Etapa 4 - Entregas

- Cadastro.
- Consulta.
- Edicao.
- Designacao de entregador.
- Atualizacao de status.
- Historico.

### Etapa 5 - Calculo de preco

- Configuracao de precos.
- Calculo automatico.
- Alteracao manual do valor.
- Botao para abrir rota no mapa.

### Etapa 6 - Dashboard

- Indicadores principais.
- Resumo financeiro simples.

### Etapa 7 - Revisao

- Testes.
- Correcoes.
- Responsividade.
- Documentacao.

## Funcionalidades ja desenvolvidas

- Estrutura backend Maven/Spring Boot.
- Estrutura frontend React/Vite.
- Layout administrativo inicial.
- Login com JWT.
- Usuario proprietario inicial para desenvolvimento.
- Rotas protegidas no frontend.
- Entidades JPA principais.
- Repositorios JPA principais.
- Migracao inicial do banco.
- Configuracao inicial de Docker Compose isolada na porta `5433`.
- README do MVP.

## Funcionalidades futuras

- Pagamento online.
- PIX.
- Rastreamento em tempo real.
- Aplicativo movel.
- WhatsApp automatico.
- Notificacoes por e-mail.
- Relatorios PDF/Excel.
- Otimizacao de rotas.
