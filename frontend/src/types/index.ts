export type PerfilAcesso = 'PROPRIETARIO' | 'ENTREGADOR' | 'CLIENTE' | 'FUNCIONARIO';
export type StatusEntrega =
  | 'SOLICITADA' | 'CONFIRMADA' | 'AGENDADA' | 'AGUARDANDO_ENTREGADOR' | 'ENTREGADOR_DESIGNADO'
  | 'COLETADA' | 'EM_ROTA' | 'TENTATIVA_FALHOU' | 'EM_DEVOLUCAO' | 'ENTREGUE'
  | 'DEVOLVIDA' | 'FALHA_OPERACIONAL' | 'CANCELADA';
export type TipoVeiculo = 'MOTO' | 'CARRO' | 'BICICLETA' | 'OUTRO';

export type Cliente = {
  id: string; nome: string; telefone: string; whatsapp?: string; email?: string; documento?: string;
  endereco: string; bairro: string; cidade: string; observacoes?: string; ativo: boolean;
  possuiAcesso?: boolean; criadoEm: string; cep?: string; logradouro: string; numero: string;
  complemento?: string; estado?: string; semNumero: boolean; versao: number;
};
export type ClienteForm = {
  nome: string; telefone: string; whatsapp: string; email: string; documento: string; endereco: string;
  bairro: string; cidade: string; observacoes: string; cep: string; logradouro: string; numero: string;
  complemento: string; estado: string; semNumero: boolean;
};

export type Entregador = {
  id: string; nome: string; cpf: string; telefone: string; email?: string; tipoVeiculo: TipoVeiculo;
  placaVeiculo?: string; ativo: boolean; disponivel: boolean; possuiAcesso: boolean; criadoEm: string; versao: number;
};
export type EntregadorForm = {
  nome: string; cpf: string; telefone: string; email: string; tipoVeiculo: TipoVeiculo;
  placaVeiculo: string; disponivel: boolean;
};
export type HistoricoEntrega = {
  statusAnterior?: StatusEntrega; novoStatus: StatusEntrega; usuarioResponsavelNome: string; alteradoEm: string;
};
export type Entrega = {
  id: string; codigo: string; clienteId: string; clienteNome: string; entregadorId?: string; entregadorNome?: string;
  enderecoOrigem: string; bairroOrigem: string; enderecoDestino: string; bairroDestino: string;
  destinatarioNome: string; destinatarioTelefone: string; descricaoMercadoria: string; observacoes?: string;
  distanciaKm: number; taxaInicial: number; valorPorKm: number; valorCalculado: number; valorFinal: number;
  observacaoValorManual?: string; status: StatusEntrega; concluidaEm?: string; criadoEm: string;
  tipoVeiculo: 'MOTO' | 'CARRO'; origemPreco: 'AREA' | 'NEGOCIADO' | 'DISTANCIA';
  areaPrecoCodigo?: string; areaPrecoNome?: string; tarifaBairro: number; possuiRetorno: boolean;
  taxaRetornoAplicada: number; tempoEsperaMinutos: number; taxaEsperaAplicada: number; valorNegociado?: number;
  historico: HistoricoEntrega[]; versao: number;
};
export type EntregaOperacional = {
  id: string; codigo: string; clienteNome: string; enderecoOrigem: string; bairroOrigem: string;
  enderecoDestino: string; bairroDestino: string; destinatarioNome: string; destinatarioTelefone: string;
  descricaoMercadoria: string; observacoes?: string; valorFinal: number; status: StatusEntrega;
  concluidaEm?: string; criadoEm: string;
  historico: Array<{ statusAnterior?: StatusEntrega; novoStatus: StatusEntrega; alteradoEm: string }>;
  versao: number;
};
export type EntregaCliente = {
  id: string; codigo: string; enderecoOrigem: string; bairroOrigem: string; enderecoDestino: string;
  bairroDestino: string; destinatarioNome: string; descricaoMercadoria: string; valorFinal: number;
  status: StatusEntrega; concluidaEm?: string; criadoEm: string;
  historico: Array<{ statusAnterior?: StatusEntrega; novoStatus: StatusEntrega; alteradoEm: string }>;
};
export type ResumoEntregador = {
  entregasAtivas: number; emRota: number; concluidasHoje: number;
  valorMovimentadoHoje: number; documentacaoPendente: number;
};
export type EntregaForm = {
  clienteId: string; entregadorId: string; enderecoOrigem: string; bairroOrigem: string;
  enderecoDestino: string; bairroDestino: string; destinatarioNome: string; destinatarioTelefone: string;
  descricaoMercadoria: string; observacoes: string; distanciaKm: string; valorFinal: string; observacaoValorManual: string;
  tipoVeiculo: 'MOTO' | 'CARRO'; tempoEsperaMinutos: string; possuiRetorno: boolean; valorNegociado: string;
};
export type ConfiguracaoPreco = {
  id: string; taxaInicial: number; valorPorKm: number; valorMinimo: number; versao: number;
};
export type ConfiguracaoPrecoForm = { taxaInicial: string; valorPorKm: string; valorMinimo: string };
export type AreaPreco = {
  id: string; codigo: string; nome: string; ordem: number; valorMoto: number; valorCarro: number;
  valorNegociado: boolean; bairros: string[]; versao: number;
};
export type TabelaPreco = {
  configuracaoId: string; nome: string; vigenteDesde: string; taxaRetorno: number;
  taxaEsperaTrintaMinutos: number; taxaInicialFallback: number; valorPorKmFallback: number;
  valorMinimoFallback: number; areas: AreaPreco[]; versao: number;
};
export type SimulacaoTabelaPreco = {
  bairroDestino: string; areaCodigo?: string; areaNome: string; tipoVeiculo: 'MOTO' | 'CARRO';
  origemPreco: 'AREA' | 'NEGOCIADO' | 'DISTANCIA'; tarifaBase?: number; taxaRetorno: number;
  taxaEspera: number; blocosEspera: number; valorCalculado?: number; valorNegociadoObrigatorio: boolean;
  mensagem: string;
};
export type SimulacaoPreco = {
  distanciaKm: number; taxaInicial: number; valorPorKm: number; valorMinimo: number; valorCalculado: number;
};

export type DashboardResumo = {
  totalEntregas: number; solicitadas: number; emAndamento: number; entregues: number; canceladas: number;
  valorTotal: number; clientes: number; entregadoresAtivos: number;
};
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO' | 'TRANSFERENCIA' | 'OUTRO';
export type TipoLancamentoFinanceiro = 'RECEBIMENTO' | 'ESTORNO';
export type Pagamento = {
  id: string; entregaId: string; entregaCodigo: string; clienteNome: string; valor: number;
  formaPagamento: FormaPagamento; pagoEm: string; comprovante?: string; observacoes?: string; criadoEm: string;
  tipo: TipoLancamentoFinanceiro; lancamentoOriginalId?: string; motivo?: string; usuarioResponsavelNome: string;
};
export type PagamentoForm = {
  entregaId: string; valor: string; formaPagamento: FormaPagamento; comprovante: string; observacoes: string;
};
export type PendenciaFinanceira = {
  entregaId: string; entregaCodigo: string; clienteNome: string; valorEntrega: number; valorPago: number; valorPendente: number;
};
export type RelatorioFinanceiro = {
  valorEntregas: number; valorRecebido: number; valorPendente: number; pagamentosRegistrados: number;
  pendencias: PendenciaFinanceira[];
};

export type Auditoria = {
  id: string; usuarioId: string; usuarioNome: string; perfil: PerfilAcesso; acao: string; entidade: string;
  entidadeId: string; valoresAnteriores?: string; valoresPosteriores?: string; motivo?: string; ocorridoEm: string;
};
export type UsuarioSistema = {
  id: string; nome: string; email: string; perfil: PerfilAcesso; ativo: boolean;
  vinculo?: 'CLIENTE' | 'ENTREGADOR'; vinculoId?: string; criadoEm: string;
};
export type ConfiguracaoEmpresa = {
  id: string; nomeFantasia: string; telefone: string; whatsapp: string; email: string; cep: string;
  logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string;
  horarioAtendimento: string; versao: number;
};

export type Funcionario = { id: string; nome: string; email: string; ativo: boolean; criadoEm: string };
export type FuncionarioForm = { nome: string; email: string; senha: string };
