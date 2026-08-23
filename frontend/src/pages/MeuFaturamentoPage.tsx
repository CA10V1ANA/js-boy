import { CalendarDays, Search, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import type { ExtratoMensalEntregador } from '../types/p3';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const dateTime = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function MeuFaturamentoPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(today.slice(0, 8) + '01');
  const [fim, setFim] = useState(today);
  const [extrato, setExtrato] = useState<ExtratoMensalEntregador | null>(null);
  const [feedback, setFeedback] = useState('');

  async function load() {
    setFeedback('');
    try {
      const response = await api.get<ExtratoMensalEntregador>('/operacao-entregador/financeiro/extrato', {
        params: { inicio, fim },
      });
      setExtrato(response.data);
    } catch (reason) {
      setFeedback(apiErrorMessage(reason, 'Não foi possível carregar seu extrato.'));
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <main className="page">
      <div className="pageHeader">
        <div><h1>Meu faturamento</h1><p>Entregas concluídas e valores do período.</p></div>
      </div>
      {feedback ? <FeedbackMessage tone="error">{feedback}</FeedbackMessage> : null}
      <section className="panelCard financePanel">
        <div className="panelCardHeader">
          <div><span className="panelIcon"><CalendarDays size={18} /></span>
            <div><h2>Período</h2><p>Consulte somente as entregas vinculadas ao seu usuário.</p></div>
          </div>
        </div>
        <div className="financeForm">
          <label>Início<input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} /></label>
          <label>Fim<input type="date" value={fim} onChange={(event) => setFim(event.target.value)} /></label>
          <button className="secondaryButton" type="button" onClick={() => void load()}>
            <Search size={17} /> Consultar
          </button>
        </div>
      </section>
      {extrato ? <>
        <section className="financeSummary">
          <article><span>Entregas concluídas</span><strong>{extrato.entregasConcluidas}</strong></article>
          <article className="result"><span>Valor faturado</span><strong>{money(extrato.valorFaturado)}</strong></article>
        </section>
        <section className="panelCard" style={{ padding: 20, marginTop: 16 }}>
          <div className="panelCardHeader"><div><span className="panelIcon"><WalletCards size={18} /></span>
            <div><h2>Entregas do extrato</h2><p>Valores registrados na conclusão de cada serviço.</p></div>
          </div></div>
          {extrato.itens.length ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ textAlign: 'left', padding: 10 }}>Entrega</th><th style={{ textAlign: 'left', padding: 10 }}>Cliente</th><th style={{ textAlign: 'left', padding: 10 }}>Concluída em</th><th style={{ textAlign: 'right', padding: 10 }}>Valor</th></tr></thead>
            <tbody>{extrato.itens.map((item) => <tr key={item.entregaId}>
              <td style={{ padding: 10, borderTop: '1px solid var(--card-border)' }}>{item.codigo}</td>
              <td style={{ padding: 10, borderTop: '1px solid var(--card-border)' }}>{item.clienteNome}</td>
              <td style={{ padding: 10, borderTop: '1px solid var(--card-border)' }}>{dateTime(item.concluidaEm)}</td>
              <td style={{ padding: 10, textAlign: 'right', borderTop: '1px solid var(--card-border)' }}>{money(item.valorFaturado)}</td>
            </tr>)}</tbody>
          </table></div> : <p>Nenhuma entrega concluída neste período.</p>}
        </section>
      </> : null}
    </main>
  );
}
