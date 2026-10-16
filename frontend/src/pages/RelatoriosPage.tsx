import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
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
  return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value);
}

function labelForma(forma: FormaPagamento) {
  return domainLabel(forma);
}

export function RelatoriosPage() {
  useLocale();
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
      showToast(message("relatorios.nao.foi.possivel.carregar.os.relatorios"), 'error');
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
    { label: message("relatorios.recebido.acumulado"), value: money(relatorio.valorRecebido), nota: relatorio.valorPendente > 0 ? message("relatorios.value.pendente", { value1: money(relatorio.valorPendente) }) : message("relatorios.tudo.recebido"), tone: relatorio.valorPendente > 0 ? '#C67A15' : '#2E8B57' },
    { label: message("relatorios.entregas.concluidas"), value: String(entregues), nota: message("relatorios.de.value.no.total", { value1: entregas.length }), tone: '#2E8B57' },
    { label: message("relatorios.ticket.medio"), value: money(ticketMedio), nota: message("relatorios.value.transacoes", { value1: relatorio.pagamentosRegistrados }), tone: '#ABA89B' },
    { label: message("relatorios.taxa.de.conclusao"), value: `${taxaConclusao}%`, nota: message(canceladas === 1 ? 'relatorios.cancelada.resumo' : 'relatorios.canceladas.resumo', { count: canceladas }), tone: canceladas > 0 ? '#C67A15' : '#2E8B57' },
  ];

  const faturamentoMensal = useMemo(() => {
    const valores = new Map<string, number>();
    pagamentos.filter((item) => item.tipo === 'RECEBIMENTO').forEach((item) => {
      const date = new Date(item.pagoEm || item.criadoEm);
      if (!Number.isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        valores.set(key, (valores.get(key) || 0) + item.valor);
      }
    });
    return Array.from(valores.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, valor]) => ({
      mes: new Intl.DateTimeFormat(getLocale(), { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${mes}-01T00:00:00Z`)), valor,
    }));
  }, [pagamentos]);

  async function exportarPdf() {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text(message("relatorios.js.boy.relatorio.financeiro"), 14, 18);
      doc.setFontSize(10); doc.text(message("relatorios.gerado.em.value", { value1: new Intl.DateTimeFormat(getLocale(), { dateStyle: 'short', timeStyle: 'short' }).format(new Date()) }), 14, 25);
      doc.setFontSize(12);
      metricas.forEach((item, index) => doc.text(`${item.label}: ${item.value} (${item.nota})`, 14, 38 + index * 8));
      doc.text(message("relatorios.faturamento.por.mes"), 14, 78);
      const max = Math.max(...faturamentoMensal.map((item) => item.valor), 1);
      faturamentoMensal.forEach((item, index) => {
        const y = 88 + index * 12; doc.text(`${item.mes}: ${money(item.valor)}`, 14, y);
        doc.setFillColor(233, 168, 28); doc.rect(72, y - 4, (item.valor / max) * 110, 5, 'F');
      });
      doc.save(`relatorio-js-boy-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch { showToast(message("relatorios.nao.foi.possivel.gerar.o.pdf"), 'error'); }
  }

  return (
    <main className="page">
      <div className="reportToolbar"><div><h1>{message("relatorios.relatorios")}</h1><p>{message("relatorios.visao.consolidada.da.operacao.e.do.faturamento")}</p></div><button className="primaryButton" type="button" onClick={() => void exportarPdf()}>{message("relatorios.baixar.relatorio.em.pdf")}</button></div>
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

      <section className="panelCard revenueChart" aria-labelledby="revenue-chart-title">
        <h2 id="revenue-chart-title">{message("relatorios.faturamento.dos.ultimos.meses")}</h2>
        {faturamentoMensal.length ? <div className="revenueBars">{faturamentoMensal.map((item) => <div className="revenueBarItem" key={item.mes}><strong>{money(item.valor)}</strong><div className="revenueBarTrack"><span style={{ width: `${Math.max(4, (item.valor / Math.max(...faturamentoMensal.map((entry) => entry.valor), 1)) * 100)}%` }} /></div><span>{item.mes}</span></div>)}</div> : <p className="emptyChart">{message("relatorios.os.pagamentos.recebidos.aparecerao.aqui.por.mes")}</p>}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="reportGrid">
        <div className="panelCard" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>{message("relatorios.formas.de.pagamento")}</h2>
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
          {formasPagamento.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>{message("relatorios.nenhum.pagamento.registrado.ainda")}</p> : null}
        </div>

        <div className="panelCard" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>{message("relatorios.clientes.que.mais.pedem")}</h2>
          {topClientes.map((cliente, index) => (
            <div
              key={cliente.nome}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--row-divider)' }}
            >
              <span className="rankBadge">{index + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cliente.nome}</span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>{String(cliente.quantidade).padStart(2, '0')}</strong>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--faint)' }}>{message("relatorios.entregas")}</span>
            </div>
          ))}
          {topClientes.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>{message("relatorios.nenhuma.entrega.registrada.ainda")}</p> : null}
        </div>
      </div>
    </main>
  );
}
