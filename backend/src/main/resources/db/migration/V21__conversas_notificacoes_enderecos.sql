create table conversas (
    id uuid primary key, entrega_id uuid not null unique references entregas(id),
    ultima_sequencia bigint not null default 0, criada_em timestamptz not null default now(),
    atualizada_em timestamptz not null default now(), reaberta_ate timestamptz
);
create table mensagens_conversa (
    id uuid primary key, conversa_id uuid not null references conversas(id), sequencia bigint not null,
    autor_id uuid references usuarios(id), autor_nome varchar(140), contexto varchar(30) not null,
    tipo varchar(10) not null check (tipo in ('TEXTO','SISTEMA')), conteudo varchar(2000) not null,
    envio_id uuid, evento_chave varchar(200), criada_em timestamptz not null default now(),
    unique (conversa_id, sequencia), unique (conversa_id, autor_id, envio_id), unique (conversa_id, evento_chave)
);
create table leituras_conversa (
    conversa_id uuid not null references conversas(id), usuario_id uuid not null references usuarios(id),
    sequencia bigint not null default 0, primary key (conversa_id, usuario_id)
);
create index idx_leituras_usuario on leituras_conversa(usuario_id);
create index idx_conversas_atividade on conversas(atualizada_em desc, id);
create table notificacoes_internas (
    id uuid primary key, usuario_id uuid not null references usuarios(id), entrega_id uuid references entregas(id),
    conversa_id uuid references conversas(id), evento varchar(80) not null, chave varchar(240) not null,
    criada_em timestamptz not null default now(), lida_em timestamptz, unique (usuario_id, chave)
);
create index idx_notificacoes_destinatario on notificacoes_internas(usuario_id, criada_em desc);
create table enderecos_cliente (
    id uuid primary key, cliente_id uuid not null references clientes(id), apelido varchar(80) not null,
    endereco varchar(180) not null, bairro varchar(80) not null, cidade varchar(80) not null,
    estado varchar(2) not null, cep varchar(8), complemento varchar(120), referencia varchar(500),
    contato_nome varchar(140), contato_telefone varchar(30), versao bigint not null default 0
);
create index idx_enderecos_cliente on enderecos_cliente(cliente_id);

-- A API Spring continua sendo o único acesso aos novos dados privados.
do $$ declare t text; p text; begin
    foreach t in array array['conversas','mensagens_conversa','leituras_conversa','notificacoes_internas','enderecos_cliente'] loop
        execute format('alter table %I enable row level security', t);
        execute format('revoke all on table %I from public', t);
        foreach p in array array['anon','authenticated'] loop
            if exists(select 1 from pg_roles where rolname=p) then
                execute format('revoke all on table %I from %I', t,p);
            end if;
        end loop;
    end loop;
end $$;
