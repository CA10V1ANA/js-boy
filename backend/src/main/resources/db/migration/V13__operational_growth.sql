alter table recorrencias_entrega add column gerada_ate date;
create table trava_financeira (id integer primary key);
insert into trava_financeira(id) values (1);
create index idx_entregas_status_conclusao on entregas(status, concluida_em);
create index idx_entregas_entregador_criado on entregas(entregador_id, criado_em, id);
create index idx_entregas_cliente_criado on entregas(cliente_id, criado_em, id);
create index idx_pagamentos_data on pagamentos(pago_em, id);
create index idx_razao_ocorrido on lancamentos_razao(ocorrido_em);
