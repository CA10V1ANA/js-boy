create table pagamentos (
    id uuid primary key,
    entrega_id uuid not null references entregas(id),
    valor numeric(10, 2) not null,
    forma_pagamento varchar(30) not null,
    pago_em timestamp with time zone not null,
    comprovante varchar(500),
    observacoes varchar(500),
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);
