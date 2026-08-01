import { Plus } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { apiErrorMessage, idempotencyKey } from '../services/apiError';
import { Entrega, FormaPagamento, Pagamento, PagamentoForm, RelatorioFinanceiro } from '../types';

const emptyForm: PagamentoForm = { entregaId: '', valor: '', formaPagamento: 'PIX', comprovante: '', observacoes: '' };
const emptyReport: RelatorioFinanceiro = { valorEntregas: 0, valorRecebido: 0, valorPendente: 0, pagamentosRegistrados: 0, pendencias: [] };
const formas: FormaPagamento[] = ['PIX', 'DINHEIRO', 'CARTAO', 'BOLETO', 'TRANSFERENCIA', 'OUTRO'];
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PagamentosPage() {
  const [items, setItems] = useState<Pagamento[]>([]);
  const [deliveries, setDeliveries] = useState<Entrega[]>([]);
  const [report, setReport] = useState(emptyReport);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [refund, setRefund] = useState<{ payment: Pagamento; value: string; reason: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [payments, deliveryResponse, reportResponse] = await Promise.all([
        api.get<Pagamento[]>('/pagamentos'), api.get<Entrega[]>('/entregas'), api.get<RelatorioFinanceiro>('/pagamentos/relatorio'),
      ]);
      setItems(payments.data); setDeliveries(deliveryResponse.data); setReport(reportResponse.data);
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel carregar os dados financeiros.'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!busy) setConfirmPayment(true);
  }

  async function register() {
    if (busy) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await api.post('/pagamentos', {
        entregaId: form.entregaId, valor: Number(form.valor), formaPagamento: form.formaPagamento,
        comprovante: form.comprovante || null, observacoes: form.observacoes || null,
      }, { headers: { 'Idempotency-Key': idempotencyKey('payment') } });
      setSuccess('Pagamento registrado.'); setForm(emptyForm); setModalOpen(false); setConfirmPayment(false);
      await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Revise os dados do pagamento e tente novamente.'));
    } finally { setBusy(false); }
  }

  async function registerRefund() {
    if (!refund || busy) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await api.post(`/pagamentos/${refund.payment.id}/estornos`, {
        valor: Number(refund.value), motivo: refund.reason,
      }, { headers: { 'Idempotency-Key': idempotencyKey('refund') } });
      setSuccess('Estorno registrado.'); setRefund(null); await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel registrar o estorno.'));
    } finally { setBusy(false); }
  }

  if (loading) return <main className="page"><LoadingState label="Carregando financeiro..." /></main>;
  if (error && items.length === 0) return <main className="page"><ErrorState message={error} onRetry={() => void load()} /></main>;

  return (
    <main className="page">
      <div className="filterBar"><span style={{ flex: 1 }} /><button className="primaryButton" type="button" onClick={() => setModalOpen(true)}><Plus size={17} /> Novo pagamento</button></div>
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
      <section className="metricGrid cols-3">
        <article className="metricCard"><span>Recebido liquido</span><strong>{money(report.valorRecebido)}</strong></article>
        <article className="metricCard"><span>Pendente</span><strong>{money(report.valorPendente)}</strong></article>
        <article className="metricCard"><span>Recebimentos</span><strong>{report.pagamentosRegistrados}</strong></article>
      </section>
      {items.length === 0 ? <EmptyState title="Nenhum lancamento financeiro" /> : (
        <section className="responsiveList">
          {items.map((payment) => (
            <article className="userCard" key={payment.id}>
              <div><strong>Entrega vinculada</strong><span>{payment.clienteNome} · {new Date(payment.pagoEm).toLocaleString('pt-BR')}</span></div>
              <dl><div><dt>Tipo</dt><dd>{payment.tipo}</dd></div><div><dt>Forma</dt><dd>{payment.formaPagamento}</dd></div><div><dt>Valor</dt><dd>{money(payment.valor)}</dd></div></dl>
              {payment.tipo === 'RECEBIMENTO' ? <button className="secondaryButton" type="button" onClick={() => setRefund({ payment, value: String(payment.valor), reason: '' })}>Estornar</button> : null}
            </article>
          ))}
        </section>
      )}
      <Modal open={modalOpen} onClose={() => !busy && setModalOpen(false)} title="Novo pagamento" maxWidth={520}>
        <form onSubmit={submit} className="settingsForm">
          <label>Entrega<select value={form.entregaId} onChange={(e) => setForm({ ...form, entregaId: e.target.value })} required><option value="">Selecione</option>{deliveries.map((delivery) => <option key={delivery.id} value={delivery.id}>{delivery.codigo} - {delivery.clienteNome}</option>)}</select></label>
          <div className="formGrid"><label>Valor<input type="number" min="0.01" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required /></label><label>Forma<select value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value as FormaPagamento })}>{formas.map((forma) => <option key={forma}>{forma}</option>)}</select></label></div>
          <label>Comprovante<input value={form.comprovante} onChange={(e) => setForm({ ...form, comprovante: e.target.value })} /></label>
          <label>Observacoes<textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></label>
          <button className="primaryButton" type="submit" disabled={busy}>Revisar pagamento</button>
        </form>
      </Modal>
      <ConfirmDialog open={confirmPayment} title="Registrar pagamento?" description={`Confirme o recebimento de ${money(Number(form.valor || 0))}.`} confirmLabel="Registrar pagamento" busy={busy} onCancel={() => setConfirmPayment(false)} onConfirm={() => void register()} />
      <Modal open={refund !== null} onClose={() => !busy && setRefund(null)} title="Registrar estorno" maxWidth={480}>
        {refund ? <form className="settingsForm" onSubmit={(e) => { e.preventDefault(); void registerRefund(); }}><label>Valor<input type="number" min="0.01" max={refund.payment.valor} step="0.01" placeholder="0,00" value={refund.value} onChange={(e) => setRefund({ ...refund, value: e.target.value })} required /></label><label>Motivo<textarea rows={3} maxLength={500} value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} required /></label><button className="dangerButton" type="submit" disabled={busy}>{busy ? 'Processando...' : 'Confirmar estorno'}</button></form> : null}
      </Modal>
    </main>
  );
}
