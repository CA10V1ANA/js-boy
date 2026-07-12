alter table entregadores
    add constraint uk_entregadores_usuario unique (usuario_id);
