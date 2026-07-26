alter table clientes add column if not exists cep varchar(8);
alter table clientes add column if not exists logradouro varchar(180);
alter table clientes add column if not exists numero varchar(20);
alter table clientes add column if not exists sem_numero boolean not null default false;
alter table clientes add column if not exists complemento varchar(120);
alter table clientes add column if not exists estado varchar(2);

update clientes
set logradouro = endereco,
    numero = 'S/N',
    sem_numero = true
where logradouro is null;

alter table clientes alter column logradouro set not null;
alter table clientes alter column numero set not null;

update clientes set documento = regexp_replace(documento, '[^0-9]', '', 'g') where documento is not null;
update clientes set telefone = regexp_replace(telefone, '[^0-9]', '', 'g');
update clientes set whatsapp = regexp_replace(whatsapp, '[^0-9]', '', 'g') where whatsapp is not null;
update clientes set email = lower(trim(email)) where email is not null;
update entregadores set cpf = regexp_replace(cpf, '[^0-9]', '', 'g');
update entregadores set telefone = regexp_replace(telefone, '[^0-9]', '', 'g');
update entregadores set email = lower(trim(email)) where email is not null;

create unique index if not exists uk_clientes_documento
    on clientes (documento);

alter table clientes add column if not exists version bigint not null default 0;
alter table entregadores add column if not exists version bigint not null default 0;
alter table entregas add column if not exists version bigint not null default 0;
alter table configuracoes_preco add column if not exists version bigint not null default 0;

create table auditorias (
    id uuid primary key,
    usuario_id uuid not null references usuarios(id),
    usuario_nome varchar(120) not null,
    perfil varchar(30) not null,
    acao varchar(60) not null,
    entidade varchar(60) not null,
    entidade_id uuid not null,
    valores_anteriores text,
    valores_posteriores text,
    motivo varchar(500),
    ocorrido_em timestamp with time zone not null,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create index idx_auditorias_ocorrido_em on auditorias (ocorrido_em desc);
create index idx_auditorias_entidade on auditorias (entidade, entidade_id);
create index idx_auditorias_usuario on auditorias (usuario_id);

create table configuracoes_empresa (
    id uuid primary key,
    nome_fantasia varchar(140) not null,
    telefone varchar(15),
    whatsapp varchar(15),
    email varchar(180),
    cep varchar(8),
    logradouro varchar(180),
    numero varchar(20),
    complemento varchar(120),
    bairro varchar(80),
    cidade varchar(80),
    estado varchar(2),
    horario_atendimento varchar(180),
    version bigint not null default 0,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

insert into configuracoes_empresa (
    id, nome_fantasia, criado_em, atualizado_em
) values (
    '00000000-0000-0000-0000-000000000002', 'JS Boy', now(), now()
);
