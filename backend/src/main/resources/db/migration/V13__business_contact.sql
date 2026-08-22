insert into configuracoes_empresa (
    id, nome_fantasia, telefone, email, version, criado_em, atualizado_em
)
select
    '00000000-0000-0000-0000-000000000002',
    'JS Boy',
    '8588071980',
    'empresajsboy@gmail.com',
    0,
    now(),
    now()
where not exists (select 1 from configuracoes_empresa);

update configuracoes_empresa
set telefone = '8588071980',
    email = 'empresajsboy@gmail.com',
    atualizado_em = now();
