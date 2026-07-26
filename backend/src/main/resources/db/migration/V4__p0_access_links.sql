alter table clientes
    add column usuario_id uuid;

alter table clientes
    add constraint fk_clientes_usuario
        foreign key (usuario_id) references usuarios(id);

alter table clientes
    add constraint uk_clientes_usuario unique (usuario_id);

update usuarios usuario
set perfil = 'ENTREGADOR'
where usuario.perfil = 'FUNCIONARIO'
  and exists (
      select 1
      from entregadores entregador
      where entregador.usuario_id = usuario.id
  );

create index idx_entregas_cliente on entregas (cliente_id);
create index idx_entregas_entregador on entregas (entregador_id);
