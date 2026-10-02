-- Repair only deliveries with no route at all. Never replace custom/partial routes
-- or manufacture completion/proof evidence. Both stops are inserted atomically.
insert into paradas_entrega (
    id, criado_em, atualizado_em, entrega_id, ordem, tipo, logradouro,
    sem_numero, bairro, contato_nome, contato_telefone, status, version
)
select gen_random_uuid(), current_timestamp, current_timestamp, e.id,
       s.ordem, s.tipo,
       case when s.ordem = 1 then e.endereco_origem else e.endereco_destino end,
       false,
       case when s.ordem = 1 then e.bairro_origem else e.bairro_destino end,
       case when s.ordem = 2 then e.destinatario_nome else null end,
       case when s.ordem = 2 then e.destinatario_telefone else null end,
       'PENDENTE', 0
from entregas e
cross join (values (1, 'COLETA'), (2, 'ENTREGA')) as s(ordem, tipo)
where not exists (select 1 from paradas_entrega p where p.entrega_id = e.id)
  and e.status not in ('ENTREGUE', 'CANCELADA');
