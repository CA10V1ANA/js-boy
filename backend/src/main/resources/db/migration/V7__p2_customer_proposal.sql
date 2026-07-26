alter table entregas add column agendada_inicio timestamp with time zone;
alter table entregas add column agendada_fim timestamp with time zone;
alter table entregas add column fuso_horario varchar(60);

create table links_rastreamento (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    entrega_id uuid not null references entregas(id),
    codigo_publico varchar(24) not null unique,
    token_hash varchar(64) not null unique,
    expira_em timestamp with time zone,
    revogado_em timestamp with time zone,
    acessos bigint not null default 0,
    ultimo_acesso_em timestamp with time zone
);

create table paradas_entrega (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    entrega_id uuid not null references entregas(id),
    ordem integer not null,
    tipo varchar(30) not null,
    logradouro varchar(180) not null,
    numero varchar(30),
    sem_numero boolean not null default false,
    complemento varchar(120),
    bairro varchar(80) not null,
    cidade varchar(80),
    estado varchar(2),
    cep varchar(8),
    contato_nome varchar(140),
    contato_telefone varchar(20),
    observacao varchar(500),
    status varchar(30) not null,
    prevista_em timestamp with time zone,
    realizada_em timestamp with time zone,
    version bigint default 0,
    constraint uq_parada_entrega_ordem unique (entrega_id, ordem)
);

insert into paradas_entrega (
    id, criado_em, atualizado_em, entrega_id, ordem, tipo, logradouro,
    sem_numero, bairro, contato_nome, contato_telefone, status
)
select gen_random_uuid(), current_timestamp, current_timestamp, id, 1, 'COLETA',
       endereco_origem, false, bairro_origem, null, null, 'PENDENTE'
from entregas;

insert into paradas_entrega (
    id, criado_em, atualizado_em, entrega_id, ordem, tipo, logradouro,
    sem_numero, bairro, contato_nome, contato_telefone, status
)
select gen_random_uuid(), current_timestamp, current_timestamp, id, 2, 'ENTREGA',
       endereco_destino, false, bairro_destino, destinatario_nome,
       destinatario_telefone, 'PENDENTE'
from entregas;

create table comprovantes_entrega (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    entrega_id uuid not null references entregas(id),
    parada_id uuid references paradas_entrega(id),
    entregador_id uuid not null references entregadores(id),
    tipo varchar(30) not null,
    storage_key varchar(255),
    mime_type varchar(80),
    tamanho_bytes bigint,
    sha256 varchar(64),
    recebedor_nome varchar(140),
    assinatura varchar(500),
    otp_hash varchar(64),
    latitude decimal(10,7),
    longitude decimal(10,7),
    localizacao_consentida boolean not null default false,
    observacao varchar(500),
    substituido_por_id uuid references comprovantes_entrega(id)
);

create table ocorrencias_entrega (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    entrega_id uuid not null references entregas(id),
    parada_id uuid references paradas_entrega(id),
    entregador_id uuid not null references entregadores(id),
    tipo varchar(40) not null,
    motivo varchar(180) not null,
    observacao varchar(500),
    proxima_acao varchar(300) not null,
    ocorrida_em timestamp with time zone not null
);

create table recorrencias_entrega (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    cliente_id uuid not null references clientes(id),
    frequencia varchar(20) not null,
    data_inicial date not null,
    data_final date,
    dias_semana varchar(40),
    fuso_horario varchar(60) not null,
    hora_inicio time,
    hora_fim time,
    endereco_origem varchar(180) not null,
    bairro_origem varchar(80) not null,
    endereco_destino varchar(180) not null,
    bairro_destino varchar(80) not null,
    destinatario_nome varchar(140) not null,
    destinatario_telefone varchar(30) not null,
    descricao_mercadoria varchar(255) not null,
    distancia_km decimal(10,2) not null default 0,
    ativa boolean not null default true,
    version bigint default 0
);

create table ocorrencias_recorrencia (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    recorrencia_id uuid not null references recorrencias_entrega(id),
    data_ocorrencia date not null,
    entrega_id uuid not null references entregas(id),
    constraint uq_recorrencia_data unique (recorrencia_id, data_ocorrencia)
);

create table preferencias_notificacao (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    cliente_id uuid not null unique references clientes(id),
    email_ativo boolean not null default true,
    whatsapp_ativo boolean not null default false,
    sms_ativo boolean not null default false
);

create table notificacoes_outbox (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    cliente_id uuid references clientes(id),
    entrega_id uuid references entregas(id),
    evento varchar(50) not null,
    canal varchar(20) not null,
    destino_mascarado varchar(180),
    payload_minimo varchar(1000) not null,
    chave_idempotencia varchar(180) not null unique,
    status varchar(20) not null,
    tentativas integer not null default 0,
    proxima_tentativa_em timestamp with time zone,
    processada_em timestamp with time zone,
    ultimo_erro varchar(300)
);

create index idx_paradas_entrega on paradas_entrega(entrega_id, ordem);
create index idx_comprovantes_entrega on comprovantes_entrega(entrega_id);
create index idx_ocorrencias_entrega on ocorrencias_entrega(entrega_id);
create index idx_outbox_status on notificacoes_outbox(status, proxima_tentativa_em);
