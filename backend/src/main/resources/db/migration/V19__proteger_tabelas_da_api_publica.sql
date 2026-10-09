-- Spring/JDBC remains the only business API. Supabase Auth/Data API roles
-- must never obtain direct access to users, deliveries or the financial ledger.
-- No FORCE RLS: the JDBC migration/table owner retains the existing access model.
do $$
declare
    tabela text;
    papel text;
    esquema text := current_schema();
begin
    foreach tabela in array array[
        'acoes_offline', 'areas_preco', 'auditorias', 'bairros_preco', 'clientes',
        'cobrancas_pix', 'comprovantes_entrega', 'configuracoes_empresa',
        'configuracoes_preco', 'desafios_comprovante_entrega', 'entregadores',
        'entregas', 'fechamentos_financeiros', 'historico_entregas', 'lancamentos_razao',
        'links_rastreamento', 'notificacoes_outbox', 'ocorrencias_entrega',
        'ocorrencias_recorrencia', 'pagamentos', 'paradas_entrega', 'password_reset_tokens',
        'preferencias_notificacao', 'recorrencias_entrega', 'refresh_tokens',
        'solicitacoes_contato', 'solicitacoes_titular', 'tentativas_login',
        'trava_financeira', 'usuarios'
    ] loop
        execute format('alter table %I.%I enable row level security', esquema, tabela);
        execute format('revoke all privileges on table %I.%I from public', esquema, tabela);
        foreach papel in array array['anon', 'authenticated'] loop
            if exists (select 1 from pg_roles where rolname = papel) then
                execute format('revoke all privileges on table %I.%I from %I', esquema, tabela, papel);
            end if;
        end loop;
    end loop;
    foreach papel in array array['anon', 'authenticated'] loop
        if exists (select 1 from pg_roles where rolname = papel) then
            execute format('alter default privileges in schema %I revoke all on tables from %I', esquema, papel);
        end if;
    end loop;
end $$;
