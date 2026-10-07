create table cobrancas_pix (
    id uuid primary key,
    entrega_id uuid not null unique references entregas(id),
    solicitante_id uuid not null references usuarios(id),
    valor numeric(12,2) not null check (valor > 0),
    email_pagador varchar(180) not null,
    mercado_pago_id bigint unique,
    status varchar(30) not null,
    qr_code_base64 text,
    qr_code_copia_e_cola text,
    expira_em timestamp with time zone,
    pagamento_id uuid unique references pagamentos(id),
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);
