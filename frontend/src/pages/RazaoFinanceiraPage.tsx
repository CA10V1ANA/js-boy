import { CalendarDays, Landmark, PlusCircle, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage, idempotencyKey } from '../services/apiError';
import type { RelatorioRazao, ResumoFaturamentoAgrupado, TipoRazao } from '../types/p3';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const options: Array<{ value: TipoRazao; label: string }> = [
  { value: 'DESPESA', label: 'Despesa' },
  { value: 'TAXA', label: 'Taxa' },
  { value: 'REPASSE_ENTREGADOR', label: 'Repasse ao entregador' },
  { value: 'AJUSTE_CREDITO', label: 'Ajuste de crédito' },
  { value: 'AJUSTE_DEBITO', label: 'Ajuste de débito' },
];

function BreakdownTable({ title, items }: { title: string; items: ResumoFaturamentoAgrupado[] }) {
  return (
    <section className="panelCard" style={{ padding: 20 }}>
      <div className="panelCardHeader">
        <div>
          <h2>{title}</h2>
          <p>Somente entregas concluídas no período selecionado.</p>
        </div>
      </div>
      {items.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10 }}>Nome</th>
                <th style={{ textAlign: 'right', padding: 10 }}>Entregas</th>
                <th style={{ textAlign: 'right', padding: 10 }}>Faturado</th>
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
      ) : <p>Nenhuma entrega concluída neste período.</p>}
    </section>
  );
}

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
    setFeedback('');
    try {
      const response = await api.get<RelatorioRazao>('/financeiro/relatorio', { params: { inicio, fim } });
      setReport(response.data);
    } catch (reason) {
      setFeedback(apiErrorMessage(reason, 'Não foi possível gerar o relatório.'));
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
      setFeedback('Lançamento registrado com sucesso.');
      await load();
    } catch (reason) {
      setFeedback(apiErrorMessage(reason, 'Não foi possível registrar.'));
    }
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>Faturamento mensal</h1>
          <p>Competência por entrega concluída, recebimentos de caixa e resultado operacional.</p>
        </div>
      </div>
      <section className="infoBanner">
        <span className="infoBannerIcon"><Landmark size={20} /></span>
        <div>
          <strong>Uma fonte única para o faturamento</strong>
          <p>O faturado usa a data de conclusão da entrega. O recebido usa a data do pagamento.</p>
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
              <div><h2>Novo lançamento</h2><p>Inclua despesa, taxa, repasse ou ajuste.</p></div>
            </div>
          </div>
          <form className="financeForm" onSubmit={submit}>
            <label>Tipo
              <select value={type} onChange={(event) => setType(event.target.value as TipoRazao)}>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>Descrição
              <input required placeholder="Ex.: combustível da semana" value={description}
                onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label>Valor
              <input required min="0.01" step="0.01" type="number" placeholder="0,00" value={value}
                onChange={(event) => setValue(event.target.value)} />
            </label>
            <button className="primaryButton" type="submit">
              <PlusCircle size={17} /> Registrar lançamento
            </button>
          </form>
        </section>
        <section className="panelCard financePanel">
          <div className="panelCardHeader">
            <div>
              <span className="panelIcon"><CalendarDays size={18} /></span>
              <div><h2>Período do relatório</h2><p>Escolha a competência a consolidar.</p></div>
            </div>
          </div>
          <div className="financeForm">
            <label>Início<input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} /></label>
            <label>Fim<input type="date" value={fim} onChange={(event) => setFim(event.target.value)} /></label>
            <button className="secondaryButton" type="button" onClick={() => void load()}>
              <Search size={17} /> Gerar relatório
            </button>
          </div>
        </section>
      </div>
      {report ? (
        <>
          <section className="financeSummary">
            <article><span>Faturado na competência</span><strong>{money(report.faturado)}</strong></article>
            <article><span>Recebido no período</span><strong>{money(report.recebido - report.estornado)}</strong></article>
            <article><span>Pendente desta competência</span><strong>{money(report.pendente)}</strong></article>
            <article><span>Despesas e taxas</span><strong>{money(report.despesas + report.taxas)}</strong></article>
            <article><span>Repasses</span><strong>{money(report.repassesEntregadores)}</strong></article>
            <article className="result">
              <span>Resultado por competência</span><strong>{money(report.resultadoCompetencia)}</strong>
            </article>
          </section>
          <div className="financeGrid" style={{ marginTop: 16 }}>
            <BreakdownTable title="Faturamento por cliente" items={report.faturamentoPorCliente} />
            <BreakdownTable title="Faturamento por entregador" items={report.faturamentoPorEntregador} />
          </div>
        </>
      ) : (
        <section className="emptyReport">
          <Landmark size={28} />
          <strong>Gere um relatório para visualizar o resumo</strong>
          <span>Selecione o período e clique em “Gerar relatório”.</span>
        </section>
      )}
    </main>
  );
}
