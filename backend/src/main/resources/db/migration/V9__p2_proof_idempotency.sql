alter table comprovantes_entrega add column chave_idempotencia varchar(180);
create unique index uq_comprovante_entregador_chave
    on comprovantes_entrega(entregador_id, chave_idempotencia);
