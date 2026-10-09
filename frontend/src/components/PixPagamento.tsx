import { OperacaoEntrega } from './OperacaoEntrega';

/** Compatibilidade para consumidores antigos: apresenta o Pix direto autorizado. */
export function PixPagamento({ entregaId }: { entregaId: string }) {
  return <OperacaoEntrega entregaId={entregaId} />;
}
