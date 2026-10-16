import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import { CalendarDays, Landmark, PlusCircle, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage, idempotencyKey } from '../services/apiError';
import type { RelatorioRazao, ResumoFaturamentoAgrupado, TipoRazao } from '../types/p3';
import { businessDate } from '../utils/businessDate';

const money = (value: number) =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value);

const getOptions = (): Array<{ value: TipoRazao; label: string }> => ([
  { value: 'DESPESA', label: message("financeiro.razao.despesa") },
  { value: 'TAXA', label: message("financeiro.razao.taxa") },
  { value: 'REPASSE_ENTREGADOR', label: message("financeiro.razao.repasse.ao.entregador") },
  { value: 'AJUSTE_CREDITO', label: message("financeiro.razao.ajuste.de.credito") },
  { value: 'AJUSTE_DEBITO', label: message("financeiro.razao.ajuste.de.debito") },
]);

function BreakdownTable({ title, items }: { title: string; items: ResumoFaturamentoAgrupado[] }) {
  useLocale();
  return (
    <section className="panelCard" style={{ padding: 20 }}>
      <div className="panelCardHeader">
        <div>
          <h2>{title}</h2>
          <p>{message("financeiro.razao.somente.entregas.concluidas.no.periodo.selecionado")}</p>
        </div>
      </div>
      {items.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10 }}>{message("financeiro.razao.nome")}</th>
                <th style={{ textAlign: 'right', padding: 10 }}>{message("financeiro.razao.entregas")}</th>
                <th style={{ textAlign: 'right', padding: 10 }}>{message("financeiro.razao.faturado")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: 10, borderTop: '1px solid var(--card-border)' }}>{item.nome}</td>
                  <td style={{ padding: 10, textAlign: 'right', borderTop: '1px solid var(--card-border)' }}>
                    {item.entregas}
                  </td>
                  <td style={{ padding: 10, textAlign: 'right', borderTop: '1px solid var(--card-border)' }}>
                    {money(item.valorFaturado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p>{message("financeiro.razao.nenhuma.entrega.concluida.neste.periodo")}</p>}
    </section>
  );
}

export function RazaoFinanceiraPage() {
  useLocale();
  const today = businessDate();
  const [inicio, setInicio] = useState(today.slice(0, 8) + '01');
  const [fim, setFim] = useState(today);
  const [report, setReport] = useState<RelatorioRazao | null>(null);
  const [type, setType] = useState<TipoRazao>('DESPESA');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState('');

  async function load() {
    setFeedback('');
    try {
      const response = await api.get<RelatorioRazao>('/financeiro/relatorio', { params: { inicio, fim } });
      setReport(response.data);
    } catch (reason) {
      setFeedback(apiErrorMessage(reason, message("financeiro.razao.nao.foi.possivel.gerar.o.relatorio")));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFeedback('');
    try {
      await api.post('/financeiro/lancamentos', {
        tipo: type,
        descricao: description,
        valor: Number(value),
        competencia: fim,
      }, { headers: { 'Idempotency-Key': idempotencyKey('razao') } });
      setDescription('');
      setValue('');
      setFeedback(message("financeiro.razao.lancamento.registrado.com.sucesso"));
      await load();
    } catch (reason) {
      setFeedback(apiErrorMessage(reason, message("financeiro.razao.nao.foi.possivel.registrar")));
    }
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>{message("financeiro.razao.faturamento.mensal")}</h1>
          <p>{message("financeiro.razao.competencia.por.entrega.concluida.recebimentos.de.caixa.e.resultado.")}</p>
        </div>
      </div>
      <section className="infoBanner">
        <span className="infoBannerIcon"><Landmark size={20} /></span>
        <div>
          <strong>{message("financeiro.razao.uma.fonte.unica.para.o.faturamento")}</strong>
          <p>{message("financeiro.razao.o.faturado.usa.a.data.de.conclusao.da.entrega.o.recebido.usa.a.data.")}</p>
        </div>
      </section>
      {feedback ? (
        <FeedbackMessage tone={feedback.startsWith('Não') ? 'error' : 'success'}>
          {feedback}
        </FeedbackMessage>
      ) : null}
      <div className="financeGrid">
        <section className="panelCard financePanel">
          <div className="panelCardHeader">
            <div>
              <span className="panelIcon"><PlusCircle size={18} /></span>
              <div><h2>{message("financeiro.razao.novo.lancamento")}</h2><p>{message("financeiro.razao.inclua.despesa.taxa.repasse.ou.ajuste")}</p></div>
            </div>
          </div>
          <form className="financeForm" onSubmit={submit}>
            <label>{message("financeiro.razao.tipo")} <select value={type} onChange={(event) => setType(event.target.value as TipoRazao)}>
                {getOptions().map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>{message("financeiro.razao.descricao")} <input required placeholder={message("financeiro.razao.ex.combustivel.da.semana")} value={description}
                onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label>{message("financeiro.razao.valor")} <input required min="0.01" step="0.01" type="number" placeholder="0,00" value={value}
                onChange={(event) => setValue(event.target.value)} />
            </label>
            <button className="primaryButton" type="submit">
              <PlusCircle size={17} /> {message("financeiro.razao.registrar.lancamento")} </button>
          </form>
        </section>
        <section className="panelCard financePanel">
          <div className="panelCardHeader">
            <div>
              <span className="panelIcon"><CalendarDays size={18} /></span>
              <div><h2>{message("financeiro.razao.periodo.do.relatorio")}</h2><p>{message("financeiro.razao.escolha.a.competencia.a.consolidar")}</p></div>
            </div>
          </div>
          <div className="financeForm">
            <label>{message("financeiro.razao.inicio")}<input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} /></label>
            <label>{message("financeiro.razao.fim")}<input type="date" value={fim} onChange={(event) => setFim(event.target.value)} /></label>
            <button className="secondaryButton" type="button" onClick={() => void load()}>
              <Search size={17} /> {message("financeiro.razao.gerar.relatorio")} </button>
          </div>
        </section>
      </div>
      {report ? (
        <>
          <section className="financeSummary">
            <article><span>{message("financeiro.razao.faturado.na.competencia")}</span><strong>{money(report.faturado)}</strong></article>
            <article><span>{message("financeiro.razao.recebido.no.periodo")}</span><strong>{money(report.recebido - report.estornado)}</strong></article>
            <article><span>{message("financeiro.razao.pendente.desta.competencia")}</span><strong>{money(report.pendente)}</strong></article>
            <article><span>{message("financeiro.razao.despesas.e.taxas")}</span><strong>{money(report.despesas + report.taxas)}</strong></article>
            <article><span>{message("financeiro.razao.repasses")}</span><strong>{money(report.repassesEntregadores)}</strong></article>
            <article className="result">
              <span>{message("financeiro.razao.resultado.por.competencia")}</span><strong>{money(report.resultadoCompetencia)}</strong>
            </article>
          </section>
          <div className="financeGrid" style={{ marginTop: 16 }}>
            <BreakdownTable title={message("financeiro.razao.faturamento.por.cliente")} items={report.faturamentoPorCliente} />
            <BreakdownTable title={message("financeiro.razao.faturamento.por.entregador")} items={report.faturamentoPorEntregador} />
          </div>
        </>
      ) : (
        <section className="emptyReport">
          <Landmark size={28} />
          <strong>{message("financeiro.razao.gere.um.relatorio.para.visualizar.o.resumo")}</strong>
          <span>{message("financeiro.razao.selecione.o.periodo.e.clique.em.gerar.relatorio")}</span>
        </section>
      )}
    </main>
  );
}
