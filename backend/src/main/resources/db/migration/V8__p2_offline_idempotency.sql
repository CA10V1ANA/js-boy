create table acoes_offline (
    id uuid primary key,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null,
    usuario_id uuid not null references usuarios(id),
    entrega_id uuid not null references entregas(id),
    chave_idempotencia varchar(180) not null,
    acao varchar(40) not null,
    resultado_status varchar(40) not null,
    constraint uq_acao_offline_usuario_chave unique (usuario_id, chave_idempotencia)
);

create index idx_acoes_offline_entrega on acoes_offline(entrega_id, criado_em);
