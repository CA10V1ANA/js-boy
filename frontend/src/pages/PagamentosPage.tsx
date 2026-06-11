import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Entrega, FormaPagamento, Pagamento, PagamentoForm, RelatorioFinanceiro } from '../types';

const emptyForm: PagamentoForm = {
  entregaId: '',
  valor: '',
  formaPagamento: 'PIX',
  comprovante: '',
  observacoes: '',
};

const formas: FormaPagamento[] = ['PIX', 'DINHEIRO', 'CARTAO', 'BOLETO', 'TRANSFERENCIA', 'OUTRO'];

const emptyRelatorio: RelatorioFinanceiro = {
  valorEntregas: 0,
  valorRecebido: 0,
  valorPendente: 0,
  pagamentosRegistrados: 0,
  pendencias: [],
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function labelForma(forma: FormaPagamento) {
  return forma.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

export function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro>(emptyRelatorio);
  const [form, setForm] = useState<PagamentoForm>(emptyForm);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    setErro('');

    try {
      const [pagamentosResponse, entregasResponse, relatorioResponse] = await Promise.all([
        api.get<Pagamento[]>('/pagamentos'),
        api.get<Entrega[]>('/entregas'),
        api.get<RelatorioFinanceiro>('/pagamentos/relatorio'),
      ]);
      setPagamentos(pagamentosResponse.data);
      setEntregas(entregasResponse.data);
      setRelatorio(relatorioResponse.data);
    } catch {
      setErro('Nao foi possivel carregar os dados financeiros.');
    }
  }

  async function registrar(event: FormEvent) {
    event.preventDefault();
    setErro('');
    setMensagem('');

    try {
      await api.post('/pagamentos', {
        entregaId: form.entregaId,
        valor: Number(form.valor),
        formaPagamento: form.formaPagamento,
        comprovante: form.comprovante || null,
        observacoes: form.observacoes || null,
      });
      setMensagem('Pagamento registrado.');
      setForm(emptyForm);
      await carregarTudo();
    } catch {
      setErro('Revise os dados do pagamento e tente novamente.');
    }
  }

  function preencherPendente(entregaId: string, valor: number) {
    setForm({
      ...form,
      entregaId,
      valor: String(valor),
    });
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>Pagamentos</h1>
          <p>Registro de recebimentos, comprovantes simples e pendencias financeiras.</p>
        </div>
      </div>

      <section className="metricGrid">
        <article className="metricCard"><span>Valor em entregas</span><strong>{money(relatorio.valorEntregas)}</strong></article>
        <article className="metricCard"><span>Recebido</span><strong>{money(relatorio.valorRecebido)}</strong></article>
        <article className="metricCard"><span>Pendente</span><strong>{money(relatorio.valorPendente)}</strong></article>
        <article className="metricCard"><span>Pagamentos</span><strong>{relatorio.pagamentosRegistrados}</strong></article>
      </section>

      <section className="adminGrid">
        <form className="adminForm" onSubmit={registrar}>
          <h2>Registrar pagamento</h2>
          <label>Entrega<select value={form.entregaId} onChange={(event: { target: { value: string } }) => setForm({ ...form, entregaId: event.target.value })} required><option value="">Selecione</option>{entregas.map((entrega) => <option key={entrega.id} value={entrega.id}>{entrega.codigo} - {entrega.clienteNome}</option>)}</select></label>
          <div className="adminFormRow">
            <label>Valor<input type="number" min="0.01" step="0.01" value={form.valor} onChange={(event: { target: { value: string } }) => setForm({ ...form, valor: event.target.value })} required /></label>
            <label>Forma<select value={form.formaPagamento} onChange={(event: { target: { value: FormaPagamento } }) => setForm({ ...form, formaPagamento: event.target.value })}>{formas.map((forma) => <option key={forma} value={forma}>{labelForma(forma)}</option>)}</select></label>
          </div>
          <label>Comprovante<input value={form.comprovante} onChange={(event: { target: { value: string } }) => setForm({ ...form, comprovante: event.target.value })} placeholder="Codigo, link ou observacao do comprovante" /></label>
          <label>Observacoes<textarea rows={3} value={form.observacoes} onChange={(event: { target: { value: string } }) => setForm({ ...form, observacoes: event.target.value })} /></label>
          <button className="primaryButton" type="submit">Registrar</button>
          {mensagem ? <p className="successMessage">{mensagem}</p> : null}
          {erro ? <p className="errorMessage">{erro}</p> : null}
        </form>

        <section className="adminList">
          <h2>Pendencias</h2>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Entrega</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Pendente</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.pendencias.map((item) => (
                  <tr key={item.entregaId}>
                    <td>{item.entregaCodigo}</td>
                    <td>{item.clienteNome}</td>
                    <td>{money(item.valorPago)}</td>
                    <td>{money(item.valorPendente)}</td>
                    <td className="rowActions"><button onClick={() => preencherPendente(item.entregaId, item.valorPendente)}>Receber</button></td>
                  </tr>
                ))}
                {relatorio.pendencias.length === 0 ? <tr><td colSpan={5}>Nenhuma pendencia encontrada.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <h2>Pagamentos recentes</h2>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Entrega</th>
                  <th>Cliente</th>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th>Comprovante</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((pagamento) => (
                  <tr key={pagamento.id}>
                    <td>{pagamento.entregaCodigo}</td>
                    <td>{pagamento.clienteNome}</td>
                    <td>{labelForma(pagamento.formaPagamento)}</td>
                    <td>{money(pagamento.valor)}</td>
                    <td>{pagamento.comprovante || '-'}</td>
                  </tr>
                ))}
                {pagamentos.length === 0 ? <tr><td colSpan={5}>Nenhum pagamento registrado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
