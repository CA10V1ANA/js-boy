export type TipoRazao = 'DESPESA' | 'TAXA' | 'REPASSE_ENTREGADOR' | 'AJUSTE_CREDITO' | 'AJUSTE_DEBITO';
export type RelatorioRazao = {
  inicio: string; fim: string; faturado: number; recebido: number; pendente: number;
  estornado: number; despesas: number; taxas: number; repassesEntregadores: number;
  resultado: number; entregasPorCliente: Record<string, number>; entregasPorEntregador: Record<string, number>;
};
