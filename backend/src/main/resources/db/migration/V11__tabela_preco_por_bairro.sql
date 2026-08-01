alter table configuracoes_preco
    add column tabela_nome varchar(80) not null default 'Tabela 2026',
    add column vigente_desde date not null default date '2026-01-01',
    add column taxa_retorno numeric(10, 2) not null default 15.00,
    add column taxa_espera_trinta_minutos numeric(10, 2) not null default 15.00;

create table areas_preco (
    id uuid primary key,
    codigo varchar(30) not null unique,
    nome varchar(80) not null,
    ordem integer not null,
    valor_moto numeric(10, 2),
    valor_carro numeric(10, 2),
    valor_negociado boolean not null default false,
    ativo boolean not null default true,
    version bigint not null default 0,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create table bairros_preco (
    id uuid primary key,
    area_preco_id uuid not null references areas_preco(id),
    nome varchar(100) not null,
    nome_normalizado varchar(100) not null unique,
    criado_em timestamp with time zone not null,
    atualizado_em timestamp with time zone not null
);

create index idx_bairros_preco_area on bairros_preco(area_preco_id);
create index idx_bairros_preco_nome_normalizado on bairros_preco(nome_normalizado);

insert into areas_preco (
    id, codigo, nome, ordem, valor_moto, valor_carro, valor_negociado, ativo, criado_em, atualizado_em
) values
    ('00000000-0000-0000-0000-000000000101', 'AREA_1', 'Área 1', 1, 21.00, 21.00, false, true, now(), now()),
    ('00000000-0000-0000-0000-000000000102', 'AREA_2', 'Área 2', 2, 26.00, 26.00, false, true, now(), now()),
    ('00000000-0000-0000-0000-000000000103', 'AREA_3', 'Área 3', 3, 26.00, 26.00, false, true, now(), now()),
    ('00000000-0000-0000-0000-000000000104', 'AREA_4', 'Área 4', 4, 29.00, 29.00, false, true, now(), now()),
    ('00000000-0000-0000-0000-000000000105', 'AREA_5', 'Área 5', 5, 31.00, 31.00, false, true, now(), now()),
    ('00000000-0000-0000-0000-000000000106', 'AREA_6', 'Área 6', 6, 31.00, 31.00, false, true, now(), now()),
    ('00000000-0000-0000-0000-000000000107', 'AREA_7', 'Área 7', 7, 33.00, 33.00, false, true, now(), now()),
    ('00000000-0000-0000-0000-000000000108', 'METROPOLITANA', 'Área Metropolitana', 8, null, null, true, true, now(), now());

insert into bairros_preco (id, area_preco_id, nome, nome_normalizado, criado_em, atualizado_em)
select md5('bairro-preco:' || dados.nome_normalizado)::uuid,
       dados.area_id::uuid, dados.nome, dados.nome_normalizado, now(), now()
from (values
    ('00000000-0000-0000-0000-000000000101', 'Aldeota', 'aldeota'),
    ('00000000-0000-0000-0000-000000000101', 'Dionísio Torres', 'dionisio torres'),
    ('00000000-0000-0000-0000-000000000101', 'Joaquim Távora', 'joaquim tavora'),
    ('00000000-0000-0000-0000-000000000101', 'José Bonifácio', 'jose bonifacio'),
    ('00000000-0000-0000-0000-000000000101', 'Meireles', 'meireles'),
    ('00000000-0000-0000-0000-000000000101', 'Praia de Iracema', 'praia de iracema'),
    ('00000000-0000-0000-0000-000000000101', 'Varjota', 'varjota'),

    ('00000000-0000-0000-0000-000000000102', 'Benfica', 'benfica'),
    ('00000000-0000-0000-0000-000000000102', 'Cocó', 'coco'),
    ('00000000-0000-0000-0000-000000000102', 'Guararapes', 'guararapes'),
    ('00000000-0000-0000-0000-000000000102', 'Montese', 'montese'),
    ('00000000-0000-0000-0000-000000000102', 'Mucuripe', 'mucuripe'),
    ('00000000-0000-0000-0000-000000000102', 'Papicu', 'papicu'),
    ('00000000-0000-0000-0000-000000000102', 'Parquelândia', 'parquelandia'),

    ('00000000-0000-0000-0000-000000000103', 'Aerolândia', 'aerolandia'),
    ('00000000-0000-0000-0000-000000000103', 'Aeroporto Velho', 'aeroporto velho'),
    ('00000000-0000-0000-0000-000000000103', 'Bairro de Fátima', 'bairro de fatima'),
    ('00000000-0000-0000-0000-000000000103', 'Cidade 2000', 'cidade 2000'),
    ('00000000-0000-0000-0000-000000000103', 'Cidade dos Funcionários', 'cidade dos funcionarios'),
    ('00000000-0000-0000-0000-000000000103', 'Edson Queiroz', 'edson queiroz'),
    ('00000000-0000-0000-0000-000000000103', 'São João do Tauape', 'sao joao do tauape'),
    ('00000000-0000-0000-0000-000000000103', 'Vila União', 'vila uniao'),

    ('00000000-0000-0000-0000-000000000104', 'Aeroporto Internacional', 'aeroporto internacional'),
    ('00000000-0000-0000-0000-000000000104', 'Bezerra de Menezes', 'bezerra de menezes'),
    ('00000000-0000-0000-0000-000000000104', 'Cajazeiras', 'cajazeiras'),
    ('00000000-0000-0000-0000-000000000104', 'Castelão', 'castelao'),
    ('00000000-0000-0000-0000-000000000104', 'Dias Macedo', 'dias macedo'),
    ('00000000-0000-0000-0000-000000000104', 'Itaoca', 'itaoca'),
    ('00000000-0000-0000-0000-000000000104', 'Itapery', 'itapery'),
    ('00000000-0000-0000-0000-000000000104', 'Passaré', 'passare'),
    ('00000000-0000-0000-0000-000000000104', 'Serrinha', 'serrinha'),

    ('00000000-0000-0000-0000-000000000105', 'Barra do Ceará', 'barra do ceara'),
    ('00000000-0000-0000-0000-000000000105', 'Carlito Pamplona', 'carlito pamplona'),
    ('00000000-0000-0000-0000-000000000105', 'Cristo Redentor', 'cristo redentor'),
    ('00000000-0000-0000-0000-000000000105', 'Jacarecanga', 'jacarecanga'),
    ('00000000-0000-0000-0000-000000000105', 'Monte Castelo', 'monte castelo'),
    ('00000000-0000-0000-0000-000000000105', 'Pirambu', 'pirambu'),
    ('00000000-0000-0000-0000-000000000105', 'Presidente Kennedy', 'presidente kennedy'),
    ('00000000-0000-0000-0000-000000000105', 'São Gerardo', 'sao gerardo'),
    ('00000000-0000-0000-0000-000000000105', 'Vila Ellery', 'vila ellery'),

    ('00000000-0000-0000-0000-000000000106', 'Alagadiço Novo', 'alagadico novo'),
    ('00000000-0000-0000-0000-000000000106', 'Barroso', 'barroso'),
    ('00000000-0000-0000-0000-000000000106', 'Cambeba', 'cambeba'),
    ('00000000-0000-0000-0000-000000000106', 'Curió', 'curio'),
    ('00000000-0000-0000-0000-000000000106', 'Messejana', 'messejana'),
    ('00000000-0000-0000-0000-000000000106', 'Parque Araxá', 'parque araxa'),
    ('00000000-0000-0000-0000-000000000106', 'Pici', 'pici'),
    ('00000000-0000-0000-0000-000000000106', 'Rodolfo Teófilo', 'rodolfo teofilo'),

    ('00000000-0000-0000-0000-000000000107', 'Antônio Bezerra', 'antonio bezerra'),
    ('00000000-0000-0000-0000-000000000107', 'Bom Jardim', 'bom jardim'),
    ('00000000-0000-0000-0000-000000000107', 'Bonsucesso', 'bonsucesso'),
    ('00000000-0000-0000-0000-000000000107', 'Canindezinho', 'canindezinho'),
    ('00000000-0000-0000-0000-000000000107', 'Conjunto Ceará', 'conjunto ceara'),
    ('00000000-0000-0000-0000-000000000107', 'Conjunto Palmeira', 'conjunto palmeira'),
    ('00000000-0000-0000-0000-000000000107', 'José Walter', 'jose walter'),
    ('00000000-0000-0000-0000-000000000107', 'Parangaba', 'parangaba'),
    ('00000000-0000-0000-0000-000000000107', 'Maraponga', 'maraponga'),
    ('00000000-0000-0000-0000-000000000107', 'Mondubim', 'mondubim'),

    ('00000000-0000-0000-0000-000000000108', 'Aquiraz', 'aquiraz'),
    ('00000000-0000-0000-0000-000000000108', 'Caucaia', 'caucaia'),
    ('00000000-0000-0000-0000-000000000108', 'Eusébio', 'eusebio'),
    ('00000000-0000-0000-0000-000000000108', 'Horizonte', 'horizonte'),
    ('00000000-0000-0000-0000-000000000108', 'Maracanaú', 'maracanau'),
    ('00000000-0000-0000-0000-000000000108', 'Maranguape', 'maranguape'),
    ('00000000-0000-0000-0000-000000000108', 'Pacajus', 'pacajus'),
    ('00000000-0000-0000-0000-000000000108', 'Pecém', 'pecem')
) as dados(area_id, nome, nome_normalizado);

alter table entregas
    add column tipo_veiculo varchar(20) not null default 'MOTO',
    add column origem_preco varchar(20) not null default 'DISTANCIA',
    add column area_preco_codigo varchar(30),
    add column area_preco_nome varchar(80),
    add column tarifa_bairro numeric(10, 2) not null default 0.00,
    add column possui_retorno boolean not null default false,
    add column taxa_retorno_aplicada numeric(10, 2) not null default 0.00,
    add column tempo_espera_minutos integer not null default 0,
    add column taxa_espera_aplicada numeric(10, 2) not null default 0.00,
    add column valor_negociado numeric(10, 2);
