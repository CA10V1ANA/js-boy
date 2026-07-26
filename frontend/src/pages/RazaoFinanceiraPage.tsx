import { FormEvent, useState } from 'react';
import { FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage, idempotencyKey } from '../services/apiError';
import type { RelatorioRazao, TipoRazao } from '../types/p3';

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function RazaoFinanceiraPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(today.slice(0, 8) + '01');
  const [fim, setFim] = useState(today);
  const [report, setReport] = useState<RelatorioRazao | null>(null);
  const [type, setType] = useState<TipoRazao>('DESPESA');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState('');
  async function load() {
    try { setReport((await api.get<RelatorioRazao>('/financeiro/relatorio', { params: { inicio, fim } })).data); }
    catch (reason) { setFeedback(apiErrorMessage(reason, 'Não foi possível gerar o relatório.')); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setFeedback('');
    try {
      await api.post('/financeiro/lancamentos', {
        tipo: type, descricao: description, valor: Number(value), competencia: today,
      }, { headers: { 'Idempotency-Key': idempotencyKey('razao') } });
      setDescription(''); setValue(''); setFeedback('Lançamento imutável registrado.'); await load();
    } catch (reason) { setFeedback(apiErrorMessage(reason, 'Não foi possível registrar.')); }
  }
  return (
    <main className="page">
      <section className="panelCard">
        <div className="panelCardHeader"><h2>Razão financeira</h2></div>
        {feedback ? <FeedbackMessage tone={feedback.startsWith('Não') ? 'error' : 'success'}>{feedback}</FeedbackMessage> : null}
        <form className="requestGrid" onSubmit={submit}>
          <label>Tipo<select value={type} onChange={(e) => setType(e.target.value as TipoRazao)}><option>DESPESA</option><option>TAXA</option><option>REPASSE_ENTREGADOR</option><option>AJUSTE_CREDITO</option><option>AJUSTE_DEBITO</option></select></label>
          <label>Descrição<input required value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label>Valor<input required min="0.01" step="0.01" type="number" value={value} onChange={(e) => setValue(e.target.value)} /></label>
          <button className="primaryButton" type="submit">Registrar lançamento</button>
        </form>
      </section>
      <section className="panelCard">
        <div className="requestGrid"><label>Início<input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label><label>Fim<input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></label><button className="secondaryButton" type="button" onClick={() => void load()}>Gerar relatório</button></div>
        {report ? <dl className="portalDetails">
          <div><dt>Faturado</dt><dd>{money(report.faturado)}</dd></div><div><dt>Recebido</dt><dd>{money(report.recebido)}</dd></div>
          <div><dt>Pendente</dt><dd>{money(report.pendente)}</dd></div><div><dt>Estornado</dt><dd>{money(report.estornado)}</dd></div>
          <div><dt>Despesas e taxas</dt><dd>{money(report.despesas + report.taxas)}</dd></div><div><dt>Repasses</dt><dd>{money(report.repassesEntregadores)}</dd></div>
          <div><dt>Resultado</dt><dd>{money(report.resultado)}</dd></div>
        </dl> : null}
      </section>
    </main>
  );
}
