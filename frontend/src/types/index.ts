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

export type HistoricoEntrega = {
  statusAnterior?: StatusEntrega;
  novoStatus: StatusEntrega;
  usuarioResponsavelNome: string;
  alteradoEm: string;
};

export type Entrega = {
  id: string;
  codigo: string;
  clienteId: string;
  clienteNome: string;
  entregadorId?: string;
  entregadorNome?: string;
  enderecoOrigem: string;
  bairroOrigem: string;
  enderecoDestino: string;
  bairroDestino: string;
  destinatarioNome: string;
  destinatarioTelefone: string;
  descricaoMercadoria: string;
  observacoes?: string;
  distanciaKm: number;
  taxaInicial: number;
  valorPorKm: number;
  valorCalculado: number;
  valorFinal: number;
  observacaoValorManual?: string;
  status: StatusEntrega;
  concluidaEm?: string;
  criadoEm: string;
  historico: HistoricoEntrega[];
};

export type EntregaForm = {
  clienteId: string;
  entregadorId: string;
  enderecoOrigem: string;
  bairroOrigem: string;
  enderecoDestino: string;
  bairroDestino: string;
  destinatarioNome: string;
  destinatarioTelefone: string;
  descricaoMercadoria: string;
  observacoes: string;
  distanciaKm: string;
  valorFinal: string;
  observacaoValorManual: string;
};

export type ConfiguracaoPreco = {
  id: string;
  taxaInicial: number;
  valorPorKm: number;
  valorMinimo: number;
};

export type ConfiguracaoPrecoForm = {
  taxaInicial: string;
  valorPorKm: string;
  valorMinimo: string;
};

export type SimulacaoPreco = {
  distanciaKm: number;
  taxaInicial: number;
  valorPorKm: number;
  valorMinimo: number;
  valorCalculado: number;
};

export type DashboardResumo = {
  totalEntregas: number;
  solicitadas: number;
  emAndamento: number;
  entregues: number;
  canceladas: number;
  valorTotal: number;
  clientes: number;
  entregadoresAtivos: number;
};
