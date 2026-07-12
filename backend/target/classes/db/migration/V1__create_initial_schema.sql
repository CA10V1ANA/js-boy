create table usuarios (
    id uuid primary key,
    nome varchar(120) not null,
    email varchar(180) not null unique,
    senha_hash varchar(255) not null,
    perfil varchar(30) not null,
    ativo boolean not null,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create table clientes (
    id uuid primary key,
    nome varchar(140) not null,
    telefone varchar(30) not null,
    whatsapp varchar(30),
    email varchar(180),
    documento varchar(20),
    endereco varchar(180) not null,
    bairro varchar(80) not null,
    cidade varchar(80) not null,
    observacoes varchar(500),
    ativo boolean not null,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create table entregadores (
    id uuid primary key,
    nome varchar(140) not null,
    cpf varchar(20) not null unique,
    telefone varchar(30) not null,
    email varchar(180),
    tipo_veiculo varchar(30) not null,
    placa_veiculo varchar(12),
    ativo boolean not null,
    disponivel boolean not null,
    usuario_id uuid references usuarios(id),
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create table configuracoes_preco (
    id uuid primary key,
    taxa_inicial numeric(10, 2) not null,
    valor_por_km numeric(10, 2) not null,
    valor_minimo numeric(10, 2) not null,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create table entregas (
    id uuid primary key,
    codigo varchar(30) not null unique,
    cliente_id uuid not null references clientes(id),
    entregador_id uuid references entregadores(id),
    endereco_origem varchar(180) not null,
    bairro_origem varchar(80) not null,
    endereco_destino varchar(180) not null,
    bairro_destino varchar(80) not null,
    destinatario_nome varchar(140) not null,
    destinatario_telefone varchar(30) not null,
    descricao_mercadoria varchar(255) not null,
    observacoes varchar(500),
    distancia_km numeric(10, 2) not null,
    taxa_inicial numeric(10, 2) not null,
    valor_por_km numeric(10, 2) not null,
    valor_calculado numeric(10, 2) not null,
    valor_final numeric(10, 2) not null,
    observacao_valor_manual varchar(500),
    status varchar(40) not null,
    concluida_em timestamp with time zone,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create table historico_entregas (
    id uuid primary key,
    entrega_id uuid not null references entregas(id),
    status_anterior varchar(40),
    novo_status varchar(40) not null,
    usuario_responsavel_id uuid not null references usuarios(id),
    alterado_em timestamp with time zone not null,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

insert into configuracoes_preco (
    id,
    taxa_inicial,
    valor_por_km,
    valor_minimo,
    criado_em,
    atualizado_em
) values (
    '00000000-0000-0000-0000-000000000001',
    5.00,
    2.00,
    10.00,
    now(),
    now()
);

