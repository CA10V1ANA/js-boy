import type { StatusEntrega } from './index';

export type TipoParada = 'COLETA' | 'ENTREGA' | 'INTERMEDIARIA';
export type StatusParada = 'PENDENTE' | 'CONCLUIDA' | 'FALHOU';
export type Parada = {
  id: string; ordem: number; tipo: TipoParada; endereco: string;
  contatoNome?: string; contatoTelefone?: string; observacao?: string;
  status: StatusParada; previstaEm?: string; realizadaEm?: string; versao: number;
};
export type Comprovante = {
  id: string; entregaId: string; paradaId?: string; tipo: 'COLETA' | 'ENTREGA' | 'OCORRENCIA';
  possuiArquivo: boolean; mimeType?: string; recebedorNome?: string; possuiAssinatura: boolean;
  localizacaoRegistrada: boolean; observacao?: string; criadoEm: string;
};
export type SolicitacaoEntrega = {
  enderecoOrigem: string; bairroOrigem: string; enderecoDestino: string; bairroDestino: string;
  destinatarioNome: string; destinatarioTelefone: string; descricaoMercadoria: string;
  observacoes: string; distanciaKm: number; agendadaInicio?: string; agendadaFim?: string;
  fusoHorario?: string;
};
export type RastreamentoPublico = {
  codigoPublico: string; status: StatusEntrega;
  linhaDoTempo: Array<{ status: StatusEntrega; data: string }>;
  estimativa?: string; concluidaEm?: string;
  empresa: { nome: string; telefone?: string; whatsapp?: string; email?: string; horario?: string };
};
