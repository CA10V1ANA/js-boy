create table refresh_tokens (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    usuario_id uuid not null references usuarios(id),
    token_hash varchar(64) not null unique,
    familia_id uuid not null,
    expira_em timestamp with time zone not null,
    revogado_em timestamp with time zone,
    substituido_por_hash varchar(64)
);

create table password_reset_tokens (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    usuario_id uuid not null references usuarios(id),
    token_hash varchar(64) not null unique,
    expira_em timestamp with time zone not null,
    usado_em timestamp with time zone
);

create table tentativas_login (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    email_hash varchar(64) not null unique,
    falhas integer not null default 0,
    bloqueado_ate timestamp with time zone,
    ultima_tentativa_em timestamp with time zone
);

create table solicitacoes_titular (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    cliente_id uuid references clientes(id),
    tipo varchar(30) not null,
    status varchar(30) not null,
    solicitada_em timestamp with time zone not null,
    concluida_em timestamp with time zone,
    justificativa varchar(500),
    usuario_responsavel_id uuid not null references usuarios(id)
);

create table lancamentos_razao (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    tipo varchar(30) not null,
    descricao varchar(180) not null,
    valor decimal(14,2) not null,
    ocorrido_em timestamp with time zone not null,
    competencia date not null,
    cliente_id uuid references clientes(id),
    entregador_id uuid references entregadores(id),
    entrega_id uuid references entregas(id),
    lancamento_original_id uuid references lancamentos_razao(id),
    usuario_responsavel_id uuid not null references usuarios(id),
    chave_idempotencia varchar(128) not null unique,
    payload_hash varchar(64) not null,
    observacao varchar(500)
);

create table fechamentos_financeiros (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    inicio date not null,
    fim date not null,
    fechado_em timestamp with time zone not null,
    reaberto_em timestamp with time zone,
    motivo_reabertura varchar(500),
    usuario_fechamento_id uuid not null references usuarios(id),
    usuario_reabertura_id uuid references usuarios(id),
    version bigint default 0,
    constraint uq_fechamento_periodo unique (inicio, fim)
);

create index idx_refresh_usuario on refresh_tokens(usuario_id, expira_em);
create index idx_reset_usuario on password_reset_tokens(usuario_id, expira_em);
create index idx_razao_competencia on lancamentos_razao(competencia, tipo);
create index idx_solicitacoes_titular on solicitacoes_titular(cliente_id, solicitada_em);
