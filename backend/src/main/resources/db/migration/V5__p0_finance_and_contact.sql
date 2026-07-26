alter table pagamentos
    add column tipo varchar(30) default 'RECEBIMENTO' not null;

alter table pagamentos
    add column lancamento_original_id uuid references pagamentos(id);

alter table pagamentos
    add column usuario_responsavel_id uuid references usuarios(id);

alter table pagamentos
    add column idempotency_key varchar(128);

alter table pagamentos
    add column payload_hash varchar(64);

alter table pagamentos
    add column motivo varchar(500);

update pagamentos
set usuario_responsavel_id = (
    select id
    from usuarios
    where perfil = 'PROPRIETARIO'
    order by criado_em
    limit 1
)
where usuario_responsavel_id is null;

update pagamentos
set idempotency_key = concat('legacy-', cast(id as varchar)),
    payload_hash = concat('legacy-', cast(id as varchar))
where idempotency_key is null;

alter table pagamentos
    alter column usuario_responsavel_id set not null;

alter table pagamentos
    alter column idempotency_key set not null;

alter table pagamentos
    alter column payload_hash set not null;

alter table pagamentos
    add constraint uk_pagamentos_idempotency_key unique (idempotency_key);

alter table pagamentos
    add constraint ck_pagamentos_valor_positivo check (valor > 0);

alter table pagamentos
    add constraint ck_pagamentos_estorno_origem check (
        (tipo = 'RECEBIMENTO' and lancamento_original_id is null)
        or (tipo = 'ESTORNO' and lancamento_original_id is not null)
    );

create index idx_pagamentos_entrega_tipo
    on pagamentos (entrega_id, tipo);

create table solicitacoes_contato (
    id uuid primary key,
    nome varchar(140) not null,
    empresa varchar(140),
    email varchar(180) not null,
    telefone varchar(20) not null,
    mensagem varchar(2000) not null,
    status varchar(30) not null,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create index idx_solicitacoes_contato_status_criado
    on solicitacoes_contato (status, criado_em);
