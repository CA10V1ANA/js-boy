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
- Axios
- Lucide React
- CSS responsivo

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

frontend/
  src/
    components/
    contexts/
    layouts/
    pages/
    routes/
    services/
    types/
```

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

Backend:

```bat
cd C:\Users\ravtec\js-boy\backend
mvn spring-boot:run
```

Se o `mvn` nao estiver no PATH:

```bat
cd C:\Users\ravtec\js-boy\backend
"C:\ProgramData\chocolatey\lib\maven\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
```

Frontend:

```bat
cd C:\Users\ravtec\js-boy\frontend
npm run dev
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/api/health`

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

Fase 8 - Testes e documentacao:

Status: nao iniciada. Ficou para a proxima etapa.

- Testes automatizados.
- Revisao do Swagger.
- Revisao de Docker.
- Revisao final do README.
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

## Comandos de validacao manual

Frontend:

```bat
cd C:\Users\ravtec\js-boy\frontend
npm run build
```

Backend:

```bat
cd C:\Users\ravtec\js-boy\backend
mvn -DskipTests compile
```

## Proximas melhorias

- Integracao real com mapas para distancia e tempo.
- Upload real de comprovantes.
- Relatorios em PDF/Excel.
- Perfil `OPERADOR`, caso a empresa precise separar atendimento do proprietario.
- Notificacoes por WhatsApp.
- Auditoria mais detalhada de alteracoes.
