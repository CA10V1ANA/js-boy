alter table usuarios add column email_verificado boolean not null default true;
alter table usuarios add column google_sub varchar(255) unique;
alter table usuarios add column senha_local boolean not null default true;
create table verificacoes_email (
    id uuid primary key, usuario_id uuid not null references usuarios(id),
    token_hash varchar(64) not null unique, email varchar(180) not null,
    expira_em timestamptz not null, usado_em timestamptz
);
alter table verificacoes_email enable row level security;
revoke all on verificacoes_email from public;
do $$ declare p text; begin
    foreach p in array array['anon','authenticated'] loop
        if exists(select 1 from pg_roles where rolname=p) then execute format('revoke all on verificacoes_email from %I',p); end if;
    end loop;
end $$;

-- Compatibilidade com o limite já adotado no cadastro do cliente.
alter table usuarios alter column nome type varchar(140);
