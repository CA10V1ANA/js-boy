export type PerfilAcesso = 'PROPRIETARIO' | 'ENTREGADOR';

export type StatusEntrega =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'AGUARDANDO_ENTREGADOR'
  | 'ENTREGADOR_DESIGNADO'
  | 'COLETADA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CANCELADA';

export type TipoVeiculo = 'MOTO' | 'CARRO' | 'BICICLETA' | 'OUTRO';

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  whatsapp?: string;
  email?: string;
  documento?: string;
  endereco: string;
  bairro: string;
  cidade: string;
  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
};

export type ClienteForm = {
  nome: string;
  telefone: string;
  whatsapp: string;
  email: string;
  documento: string;
  endereco: string;
  bairro: string;
  cidade: string;
  observacoes: string;
};

export type Entregador = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  tipoVeiculo: TipoVeiculo;
  placaVeiculo?: string;
  ativo: boolean;
  disponivel: boolean;
  criadoEm: string;
};

export type EntregadorForm = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  tipoVeiculo: TipoVeiculo;
  placaVeiculo: string;
  disponivel: boolean;
};
