export type TipoRazao = 'DESPESA' | 'TAXA' | 'REPASSE_ENTREGADOR' | 'AJUSTE_CREDITO' | 'AJUSTE_DEBITO';

export type ResumoFaturamentoAgrupado = {
  id: string;
  nome: string;
  entregas: number;
  valorFaturado: number;
};

export type RelatorioRazao = {
  inicio: string;
  fim: string;
  faturado: number;
  recebido: number;
  pendente: number;
  estornado: number;
  despesas: number;
  taxas: number;
  repassesEntregadores: number;
  resultado: number;
  entregasPorCliente: Record<string, number>;
  entregasPorEntregador: Record<string, number>;
  entregasFaturadas: number;
  recebidoDoFaturamento: number;
  resultadoCompetencia: number;
  resultadoCaixa: number;
  faturamentoPorCliente: ResumoFaturamentoAgrupado[];
  faturamentoPorEntregador: ResumoFaturamentoAgrupado[];
};

export type ItemExtratoMensalEntregador = {
  entregaId: string;
  codigo: string;
  clienteNome: string;
  concluidaEm: string;
  valorFaturado: number;
};

export type ExtratoMensalEntregador = {
  inicio: string;
  fim: string;
  entregasConcluidas: number;
  valorFaturado: number;
  itens: ItemExtratoMensalEntregador[];
};
