import { CalendarDays, Landmark, PlusCircle, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage, idempotencyKey } from '../services/apiError';
import type { RelatorioRazao, TipoRazao } from '../types/p3';

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const options: Array<{ value: TipoRazao; label: string }> = [{ value: 'DESPESA', label: 'Despesa' }, { value: 'TAXA', label: 'Taxa' }, { value: 'REPASSE_ENTREGADOR', label: 'Repasse ao entregador' }, { value: 'AJUSTE_CREDITO', label: 'Ajuste de credito' }, { value: 'AJUSTE_DEBITO', label: 'Ajuste de debito' }];

export function RazaoFinanceiraPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(today.slice(0, 8) + '01'); const [fim, setFim] = useState(today);
  const [report, setReport] = useState<RelatorioRazao | null>(null); const [type, setType] = useState<TipoRazao>('DESPESA');
  const [description, setDescription] = useState(''); const [value, setValue] = useState(''); const [feedback, setFeedback] = useState('');
  async function load() { try { setReport((await api.get<RelatorioRazao>('/financeiro/relatorio', { params: { inicio, fim } })).data); } catch (reason) { setFeedback(apiErrorMessage(reason, 'Nao foi possivel gerar o relatorio.')); } }
  async function submit(event: FormEvent) { event.preventDefault(); setFeedback(''); try { await api.post('/financeiro/lancamentos', { tipo: type, descricao: description, valor: Number(value), competencia: today }, { headers: { 'Idempotency-Key': idempotencyKey('razao') } }); setDescription(''); setValue(''); setFeedback('Lancamento registrado com sucesso.'); await load(); } catch (reason) { setFeedback(apiErrorMessage(reason, 'Nao foi possivel registrar.')); } }

  return <main className="page">
    <div className="pageHeader"><div><h1>Razao financeira</h1><p>Registre despesas, taxas e ajustes e acompanhe o resultado da operacao.</p></div></div>
    <section className="infoBanner"><span className="infoBannerIcon"><Landmark size={20} /></span><div><strong>Controle financeiro operacional</strong><p>Cada lancamento forma um historico permanente. O relatorio consolida valores faturados, recebidos, despesas e repasses.</p></div></section>
    {feedback ? <FeedbackMessage tone={feedback.startsWith('Nao') ? 'error' : 'success'}>{feedback}</FeedbackMessage> : null}
    <div className="financeGrid">
      <section className="panelCard financePanel"><div className="panelCardHeader"><div><span className="panelIcon"><PlusCircle size={18} /></span><div><h2>Novo lancamento</h2><p>Inclua uma movimentacao manual.</p></div></div></div><form className="financeForm" onSubmit={submit}><label>Tipo<select value={type} onChange={(event) => setType(event.target.value as TipoRazao)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Descricao<input required placeholder="Ex.: combustivel da semana" value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Valor<input required min="0.01" step="0.01" type="number" placeholder="0,00" value={value} onChange={(event) => setValue(event.target.value)} /></label><button className="primaryButton" type="submit"><PlusCircle size={17} /> Registrar lancamento</button></form></section>
      <section className="panelCard financePanel"><div className="panelCardHeader"><div><span className="panelIcon"><CalendarDays size={18} /></span><div><h2>Periodo do relatorio</h2><p>Escolha as datas para consolidar.</p></div></div></div><div className="financeForm"><label>Inicio<input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} /></label><label>Fim<input type="date" value={fim} onChange={(event) => setFim(event.target.value)} /></label><button className="secondaryButton" type="button" onClick={() => void load()}><Search size={17} /> Gerar relatorio</button></div></section>
    </div>
    {report ? <section className="financeSummary"><article><span>Faturado</span><strong>{money(report.faturado)}</strong></article><article><span>Recebido</span><strong>{money(report.recebido)}</strong></article><article><span>Pendente</span><strong>{money(report.pendente)}</strong></article><article><span>Despesas e taxas</span><strong>{money(report.despesas + report.taxas)}</strong></article><article><span>Repasses</span><strong>{money(report.repassesEntregadores)}</strong></article><article className="result"><span>Resultado</span><strong>{money(report.resultado)}</strong></article></section> : <section className="emptyReport"><Landmark size={28} /><strong>Gere um relatorio para visualizar o resumo</strong><span>Selecione o periodo e clique em “Gerar relatorio”.</span></section>}
  </main>;
}