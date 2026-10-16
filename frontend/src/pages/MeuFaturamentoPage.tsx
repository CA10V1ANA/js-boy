import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import { CalendarDays, Search, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import type { ExtratoMensalEntregador } from '../types/p3';
import { businessDate } from '../utils/businessDate';

const money = (value: number) =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value);

const dateTime = (value: string) =>
  new Intl.DateTimeFormat(getLocale(), { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function MeuFaturamentoPage() {
  useLocale();
  const today = businessDate();
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
      setFeedback(apiErrorMessage(reason, message("entregador.faturamento.nao.foi.possivel.carregar.seu.extrato")));
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <main className="page">
      <div className="pageHeader">
        <div><h1>{message("entregador.faturamento.meu.faturamento")}</h1><p>{message("entregador.faturamento.valores.movimentados.nas.suas.entregas.concluidas.nao.representam.co")}</p></div>
      </div>
      {feedback ? <FeedbackMessage tone="error">{feedback}</FeedbackMessage> : null}
      <section className="panelCard financePanel">
        <div className="panelCardHeader">
          <div><span className="panelIcon"><CalendarDays size={18} /></span>
            <div><h2>{message("entregador.faturamento.periodo")}</h2><p>{message("entregador.faturamento.consulte.somente.as.entregas.vinculadas.ao.seu.usuario")}</p></div>
          </div>
        </div>
        <div className="financeForm">
          <label>{message("entregador.faturamento.inicio")}<input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} /></label>
          <label>{message("entregador.faturamento.fim")}<input type="date" value={fim} onChange={(event) => setFim(event.target.value)} /></label>
          <button className="secondaryButton" type="button" onClick={() => void load()}>
            <Search size={17} /> {message("entregador.faturamento.consultar")} </button>
        </div>
      </section>
      {extrato ? <>
        <section className="financeSummary">
          <article><span>{message("entregador.faturamento.entregas.concluidas")}</span><strong>{extrato.entregasConcluidas}</strong></article>
          <article className="result"><span>{message("entregador.faturamento.valor.movimentado")}</span><strong>{money(extrato.valorFaturado)}</strong></article>
        </section>
        <section className="panelCard" style={{ padding: 20, marginTop: 16 }}>
          <div className="panelCardHeader"><div><span className="panelIcon"><WalletCards size={18} /></span>
            <div><h2>{message("entregador.faturamento.entregas.do.extrato")}</h2><p>{message("entregador.faturamento.valores.registrados.na.conclusao.de.cada.servico")}</p></div>
          </div></div>
          {extrato.itens.length ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ textAlign: 'left', padding: 10 }}>{message("entregador.faturamento.entrega")}</th><th style={{ textAlign: 'left', padding: 10 }}>{message("entregador.faturamento.cliente")}</th><th style={{ textAlign: 'left', padding: 10 }}>{message("entregador.faturamento.concluida.em")}</th><th style={{ textAlign: 'right', padding: 10 }}>{message("entregador.faturamento.valor")}</th></tr></thead>
            <tbody>{extrato.itens.map((item) => <tr key={item.entregaId}>
              <td style={{ padding: 10, borderTop: '1px solid var(--card-border)' }}>{item.codigo}</td>
              <td style={{ padding: 10, borderTop: '1px solid var(--card-border)' }}>{item.clienteNome}</td>
              <td style={{ padding: 10, borderTop: '1px solid var(--card-border)' }}>{dateTime(item.concluidaEm)}</td>
              <td style={{ padding: 10, textAlign: 'right', borderTop: '1px solid var(--card-border)' }}>{money(item.valorFaturado)}</td>
            </tr>)}</tbody>
          </table></div> : <p>{message("entregador.faturamento.nenhuma.entrega.concluida.neste.periodo")}</p>}
        </section>
      </> : null}
    </main>
  );
}
