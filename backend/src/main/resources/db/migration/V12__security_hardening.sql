create table desafios_comprovante_entrega (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    entrega_id uuid not null unique references entregas(id),
    parada_id uuid not null references paradas_entrega(id),
    codigo_hash varchar(64) not null,
    destino_mascarado varchar(40) not null,
    expira_em timestamp with time zone not null,
    ultimo_envio_em timestamp with time zone not null,
    consumido_em timestamp with time zone,
    tentativas integer not null default 0,
    version bigint default 0
);

alter table comprovantes_entrega add column desafio_id uuid references desafios_comprovante_entrega(id);
alter table comprovantes_entrega add column verificado_em timestamp with time zone;

create index idx_desafio_comprovante_expira on desafios_comprovante_entrega(expira_em);
create index idx_comprovante_entrega_verificado
    on comprovantes_entrega(entrega_id, tipo, verificado_em);
create unique index uq_comprovante_desafio
    on comprovantes_entrega(desafio_id) where desafio_id is not null;
create index idx_refresh_familia on refresh_tokens(familia_id, revogado_em);
