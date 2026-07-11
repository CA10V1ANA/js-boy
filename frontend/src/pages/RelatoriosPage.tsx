import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { Entrega, FormaPagamento, Pagamento, RelatorioFinanceiro } from '../types';

const emptyRelatorio: RelatorioFinanceiro = {
  valorEntregas: 0,
  valorRecebido: 0,
  valorPendente: 0,
  pagamentosRegistrados: 0,
  pendencias: [],
};

const coresForma: Record<string, string> = {
  PIX: '#2E8B57',
  DINHEIRO: '#E9A81C',
  CARTAO: '#6E58C8',
  BOLETO: '#3E6EA8',
  TRANSFERENCIA: '#1B8079',
  OUTRO: '#8A8578',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function labelForma(forma: FormaPagamento) {
  return forma.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

export function RelatoriosPage() {
  const { showToast } = useToast();
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro>(emptyRelatorio);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregar() {
    try {
      const [relatorioResponse, pagamentosResponse, entregasResponse] = await Promise.all([
        api.get<RelatorioFinanceiro>('/pagamentos/relatorio'),
        api.get<Pagamento[]>('/pagamentos'),
        api.get<Entrega[]>('/entregas'),
      ]);
      setRelatorio(relatorioResponse.data);
      setPagamentos(pagamentosResponse.data);
      setEntregas(entregasResponse.data);
    } catch {
      showToast('Nao foi possivel carregar os relatorios.', 'error');
    }
  }

  const entregues = useMemo(() => entregas.filter((entrega) => entrega.status === 'ENTREGUE').length, [entregas]);
  const canceladas = useMemo(() => entregas.filter((entrega) => entrega.status === 'CANCELADA').length, [entregas]);

  const ticketMedio = relatorio.pagamentosRegistrados > 0
    ? relatorio.valorRecebido / relatorio.pagamentosRegistrados
    : 0;

  const taxaConclusao = entregas.length > 0
    ? Math.round((entregues / entregas.length) * 100)
    : 0;

  const formasPagamento = useMemo(() => {
    if (pagamentos.length === 0) {
      return [] as { forma: FormaPagamento; pct: number }[];
    }

    const contagem = new Map<FormaPagamento, number>();
    pagamentos.forEach((pagamento) => {
      contagem.set(pagamento.formaPagamento, (contagem.get(pagamento.formaPagamento) || 0) + 1);
    });

    return Array.from(contagem.entries())
      .map(([forma, quantidade]) => ({ forma, pct: Math.round((quantidade / pagamentos.length) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  }, [pagamentos]);

  const topClientes = useMemo(() => {
    const contagem = new Map<string, number>();
    entregas.forEach((entrega) => {
      contagem.set(entrega.clienteNome, (contagem.get(entrega.clienteNome) || 0) + 1);
    });

    return Array.from(contagem.entries())
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 4);
  }, [entregas]);

  const metricas = [
    { label: 'Faturamento no mes', value: money(relatorio.valorRecebido), nota: relatorio.valorPendente > 0 ? `${money(relatorio.valorPendente)} pendente` : 'tudo recebido', tone: relatorio.valorPendente > 0 ? '#C67A15' : '#2E8B57' },
    { label: 'Entregas concluidas', value: String(entregues), nota: `de ${entregas.length} no total`, tone: '#2E8B57' },
    { label: 'Ticket medio', value: money(ticketMedio), nota: `${relatorio.pagamentosRegistrados} transacoes`, tone: '#ABA89B' },
    { label: 'Taxa de conclusao', value: `${taxaConclusao}%`, nota: `${canceladas} cancelada${canceladas === 1 ? '' : 's'}`, tone: canceladas > 0 ? '#C67A15' : '#2E8B57' },
  ];

  return (
    <main className="page">
      <section className="metricGrid">
        {metricas.map((metrica) => (
          <article className="metricCard" key={metrica.label}>
            <span>{metrica.label}</span>
            <strong style={{ fontSize: 23 }}>{metrica.value}</strong>
            <div className="metricDelta">
              <span style={{ color: metrica.tone }}>{metrica.nota}</span>
            </div>
          </article>
        ))}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="reportGrid">
        <div className="panelCard" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Formas de pagamento</h2>
          {formasPagamento.map((item) => (
            <div key={item.forma} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{labelForma(item.forma)}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>{item.pct}%</span>
              </div>
              <div className="barTrack">
                <div className="barFill" style={{ width: `${item.pct}%`, background: coresForma[item.forma] || '#8A8578' }} />
              </div>
            </div>
          ))}
          {formasPagamento.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>Nenhum pagamento registrado ainda.</p> : null}
        </div>

        <div className="panelCard" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>Clientes que mais pedem</h2>
          {topClientes.map((cliente, index) => (
            <div
              key={cliente.nome}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--row-divider)' }}
            >
              <span className="rankBadge">{index + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cliente.nome}</span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>{String(cliente.quantidade).padStart(2, '0')}</strong>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--faint)' }}>entregas</span>
            </div>
          ))}
          {topClientes.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>Nenhuma entrega registrada ainda.</p> : null}
        </div>
      </div>
    </main>
  );
}
