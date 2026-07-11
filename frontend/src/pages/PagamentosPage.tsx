import { Plus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
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

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro>(emptyRelatorio);
  const [form, setForm] = useState<PagamentoForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
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

  function abrirNovoPagamento() {
    setForm(emptyForm);
    setModalOpen(true);
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
      setModalOpen(false);
      await carregarTudo();
    } catch {
      setErro('Revise os dados do pagamento e tente novamente.');
    }
  }

  function preencherPendente(entregaId: string, valor: number) {
    setForm({ ...form, entregaId, valor: String(valor) });
    setModalOpen(true);
  }

  const cards = [
    { label: 'Recebido no mes', value: money(relatorio.valorRecebido), cor: 'var(--ink)' },
    { label: 'Pendente', value: money(relatorio.valorPendente), cor: relatorio.valorPendente > 0 ? '#C67A15' : 'var(--ink)' },
    { label: 'Transacoes', value: String(relatorio.pagamentosRegistrados).padStart(2, '0'), cor: 'var(--ink)' },
  ] as const;

  return (
    <main className="page">
      <div className="filterBar">
        <span style={{ flex: 1 }} />
        <button className="primaryButton" onClick={abrirNovoPagamento} type="button">
          <Plus size={17} /> Novo pagamento
        </button>
      </div>

      <section className="metricGrid cols-3">
        {cards.map((card) => (
          <article className="metricCard" key={card.label} style={{ padding: '18px 20px' }}>
            <span>{card.label}</span>
            <strong className="smaller" style={{ color: card.cor }}>{card.value}</strong>
          </article>
        ))}
      </section>

      {mensagem ? <p className="successMessage" style={{ marginBottom: 16 }}>{mensagem}</p> : null}
      {erro ? <p className="errorMessage" style={{ marginBottom: 16 }}>{erro}</p> : null}

      <section className="adminList" style={{ marginBottom: 20, overflow: 'visible' }}>
        <h2 className="listTitle">Pendencias</h2>
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
                  <td style={{ color: '#B4791A', fontWeight: 700 }}>{money(item.valorPendente)}</td>
                  <td className="rowActions"><button onClick={() => preencherPendente(item.entregaId, item.valorPendente)} type="button">Receber</button></td>
                </tr>
              ))}
              {relatorio.pendencias.length === 0 ? <tr><td colSpan={5}>Nenhuma pendencia encontrada.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adminList" style={{ overflow: 'visible' }}>
        <h2 className="listTitle">Historico de pagamentos</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Entrega</th>
                <th>Cliente</th>
                <th>Forma</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((pagamento) => (
                <tr key={pagamento.id}>
                  <td>{pagamento.entregaCodigo}</td>
                  <td>{pagamento.clienteNome}</td>
                  <td><span className="formaChip">{labelForma(pagamento.formaPagamento)}</span></td>
                  <td>{formatarData(pagamento.pagoEm)}</td>
                  <td>{money(pagamento.valor)}</td>
                  <td>{pagamento.comprovante || '-'}</td>
                </tr>
              ))}
              {pagamentos.length === 0 ? <tr><td colSpan={6}>Nenhum pagamento registrado.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo pagamento" maxWidth={520}>
        <form onSubmit={registrar} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            Entrega
            <select value={form.entregaId} onChange={(event) => setForm({ ...form, entregaId: event.target.value })} required>
              <option value="">Selecione</option>
              {entregas.map((entrega) => <option key={entrega.id} value={entrega.id}>{entrega.codigo} - {entrega.clienteNome}</option>)}
            </select>
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
            <label>
              Valor
              <input type="number" min="0.01" step="0.01" value={form.valor} onChange={(event) => setForm({ ...form, valor: event.target.value })} required />
            </label>
            <label>
              Forma
              <select value={form.formaPagamento} onChange={(event) => setForm({ ...form, formaPagamento: event.target.value as FormaPagamento })}>
                {formas.map((forma) => <option key={forma} value={forma}>{labelForma(forma)}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'grid', gap: 7 }}>
            Comprovante
            <input value={form.comprovante} onChange={(event) => setForm({ ...form, comprovante: event.target.value })} placeholder="Codigo, link ou observacao" />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            Observacoes
            <textarea rows={3} value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} />
          </label>
          <button className="primaryButton" type="submit">Registrar</button>
        </form>
      </Modal>
    </main>
  );
}
