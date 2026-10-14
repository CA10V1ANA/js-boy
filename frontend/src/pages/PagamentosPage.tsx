import { Banknote, CircleCheckBig, Clock3, Plus, ReceiptText, Undo2, WalletCards } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { Modal } from '../components/Modal';
import { PixPagamento } from '../components/PixPagamento';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import {
  clearPaymentIntent, clearRefundIntent, createPaymentIntent, createRefundIntent,
  pendingPayment, pendingRefund, PendingPayment, PendingRefund,
} from '../services/financialIntent';
import { Entrega, FormaPagamento, Pagamento, PagamentoForm, RelatorioFinanceiro } from '../types';

const emptyForm: PagamentoForm = { entregaId: '', valor: '', formaPagamento: 'PIX', comprovante: '', observacoes: '' };
const emptyReport: RelatorioFinanceiro = { valorEntregas: 0, valorRecebido: 0, valorPendente: 0, pagamentosRegistrados: 0, pendencias: [] };
const formas: FormaPagamento[] = ['PIX', 'DINHEIRO'];
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value));
const paymentMethodLabel = (value: FormaPagamento) => ({
  PIX: 'Pix', DINHEIRO: 'Dinheiro', CARTAO: 'Cartão', BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência', OUTRO: 'Outro',
})[value];

export function PagamentosPage() {
  const { usuario } = useAuth();
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
  const [paymentIntent, setPaymentIntent] = useState<PendingPayment | null>(null);
  const [refundIntent, setRefundIntent] = useState<PendingRefund | null>(null);
  const [discardIntent, setDiscardIntent] = useState<'payment' | 'refund' | null>(null);

  useEffect(() => {
    if (!usuario) return;
    setPaymentIntent(pendingPayment(usuario.id));
    setRefundIntent(pendingRefund(usuario.id));
  }, [usuario]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [payments, deliveryResponse, reportResponse] = await Promise.all([
        api.get<Pagamento[]>('/pagamentos'), api.get<Entrega[]>('/entregas'), api.get<RelatorioFinanceiro>('/pagamentos/relatorio'),
      ]);
      setItems(payments.data); setDeliveries(deliveryResponse.data); setReport(reportResponse.data);
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Não foi possível carregar os dados financeiros.'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!busy) setConfirmPayment(true);
  }

  async function sendPayment(intent: PendingPayment) {
    if (busy) return;
    setBusy(true); setError(''); setSuccess('');
    setConfirmPayment(false); setModalOpen(false);
    try {
      await api.post('/pagamentos', intent.payload, { headers: { 'Idempotency-Key': intent.chave } });
      clearPaymentIntent(); setPaymentIntent(null);
      setSuccess('Pagamento registrado.'); setForm(emptyForm);
      await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Resultado do pagamento não confirmado. Reenvie a tentativa pendente.'));
    } finally { setBusy(false); }
  }

  function register() {
    if (busy || paymentIntent || !usuario) return;
    try {
      const intent = createPaymentIntent(usuario.id, {
        entregaId: form.entregaId, valor: Number(form.valor), formaPagamento: form.formaPagamento,
        comprovante: form.comprovante || null, observacoes: form.observacoes || null,
      });
      setPaymentIntent(intent);
      void sendPayment(intent);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível preparar o pagamento.');
    }
  }

  async function sendRefund(intent: PendingRefund) {
    if (busy) return;
    setBusy(true); setError(''); setSuccess('');
    setRefund(null);
    try {
      await api.post(`/pagamentos/${intent.pagamentoId}/estornos`, intent.payload,
        { headers: { 'Idempotency-Key': intent.chave } });
      clearRefundIntent(); setRefundIntent(null);
      setSuccess('Estorno registrado.'); await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Resultado do estorno não confirmado. Reenvie a tentativa pendente.'));
    } finally { setBusy(false); }
  }

  function registerRefund() {
    if (!refund || busy || refundIntent || !usuario) return;
    try {
      const intent = createRefundIntent(usuario.id, refund.payment.id,
        { valor: Number(refund.value), motivo: refund.reason });
      setRefundIntent(intent);
      void sendRefund(intent);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível preparar o estorno.');
    }
  }

  function discardPending() {
    if (discardIntent === 'payment') { clearPaymentIntent(); setPaymentIntent(null); }
    if (discardIntent === 'refund') { clearRefundIntent(); setRefundIntent(null); }
    setDiscardIntent(null);
    setError('');
  }

  if (loading) return <main className="page"><LoadingState label="Carregando financeiro..." /></main>;
  if (error && items.length === 0 && deliveries.length === 0 && !paymentIntent && !refundIntent) {
    return <main className="page"><ErrorState message={error} onRetry={() => void load()} /></main>;
  }

  return (
    <main className="page paymentsPage">
      <header className="paymentsToolbar">
        <div>
          <span className="paymentsEyebrow">CONTROLE FINANCEIRO</span>
          <h1>Visão financeira</h1>
          <p>Acompanhe valores recebidos, saldos em aberto e o histórico de movimentações.</p>
        </div>
        <button className="primaryButton" type="button" disabled={Boolean(paymentIntent) || busy} onClick={() => setModalOpen(true)}><Plus size={17} /> Novo pagamento</button>
      </header>
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
      {paymentIntent ? <div className="infoBanner"><div><strong>Pagamento pendente de confirmação</strong><p>Reenvie a mesma tentativa de {money(paymentIntent.payload.valor)}. Antes de descartá-la, confira o histórico para evitar duplicidade.</p></div><button type="button" disabled={busy} onClick={() => void sendPayment(paymentIntent)}>Reenviar pagamento pendente</button><button type="button" disabled={busy} onClick={() => setDiscardIntent('payment')}>Descartar tentativa</button></div> : null}
      {refundIntent ? <div className="infoBanner"><div><strong>Estorno pendente de confirmação</strong><p>Reenvie a mesma tentativa de {money(refundIntent.payload.valor)}. Antes de descartá-la, confira o histórico.</p></div><button type="button" disabled={busy} onClick={() => void sendRefund(refundIntent)}>Reenviar estorno pendente</button><button type="button" disabled={busy} onClick={() => setDiscardIntent('refund')}>Descartar tentativa</button></div> : null}
      <section className="paymentsMetricGrid" aria-label="Resumo financeiro">
        <article className="paymentMetricCard">
          <span className="paymentMetricIcon neutral"><WalletCards size={19} aria-hidden="true" /></span>
          <div><span>Total em entregas</span><strong>{money(report.valorEntregas)}</strong><small>Valor contratado</small></div>
        </article>
        <article className="paymentMetricCard received">
          <span className="paymentMetricIcon"><CircleCheckBig size={19} aria-hidden="true" /></span>
          <div><span>Recebido líquido</span><strong>{money(report.valorRecebido)}</strong><small>Valores confirmados</small></div>
        </article>
        <article className="paymentMetricCard pending">
          <span className="paymentMetricIcon"><Clock3 size={19} aria-hidden="true" /></span>
          <div><span>Saldo pendente</span><strong>{money(report.valorPendente)}</strong><small>{report.pendencias.length} {report.pendencias.length === 1 ? 'entrega em aberto' : 'entregas em aberto'}</small></div>
        </article>
        <article className="paymentMetricCard">
          <span className="paymentMetricIcon neutral"><ReceiptText size={19} aria-hidden="true" /></span>
          <div><span>Lançamentos</span><strong>{report.pagamentosRegistrados}</strong><small>Recebimentos registrados</small></div>
        </article>
      </section>

      {report.pendencias.length > 0 ? (
        <section className="paymentsSection" aria-labelledby="pending-payments-title">
          <div className="paymentsSectionHeader">
            <div>
              <span className="paymentsEyebrow">OPERAÇÃO EM ABERTO</span>
              <h2 id="pending-payments-title">Recebimentos pendentes</h2>
              <p>Confira a rota, o recebedor e o saldo antes de regularizar cada entrega.</p>
            </div>
            <span className="paymentsCount">{report.pendencias.length}</span>
          </div>
          <div className="pendingPaymentsList">
            {report.pendencias.map((pending) => (
              <article className="paymentPendingCard" key={pending.entregaId} aria-labelledby={`pending-${pending.entregaId}`}>
                <header className="paymentPendingHeader">
                  <div className="paymentPendingIdentity">
                    <span className="paymentPendingIcon"><Banknote size={20} aria-hidden="true" /></span>
                    <div>
                      <span>Entrega {pending.entregaCodigo}</span>
                      <h3 id={`pending-${pending.entregaId}`}>{pending.clienteNome}</h3>
                    </div>
                  </div>
                  <dl className="paymentPendingAmounts">
                    <div><dt>Valor da entrega</dt><dd>{money(pending.valorEntrega)}</dd></div>
                    <div><dt>Já recebido</dt><dd>{money(pending.valorPago)}</dd></div>
                    <div className="highlight"><dt>Saldo pendente</dt><dd>{money(pending.valorPendente)}</dd></div>
                  </dl>
                </header>
                <PixPagamento entregaId={pending.entregaId} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="paymentsSection" aria-labelledby="payment-history-title">
        <div className="paymentsSectionHeader">
          <div>
            <span className="paymentsEyebrow">MOVIMENTAÇÕES</span>
            <h2 id="payment-history-title">Histórico de lançamentos</h2>
            <p>Recebimentos e estornos registrados na operação.</p>
          </div>
          <span className="paymentsCount neutral">{items.length}</span>
        </div>
        {items.length === 0 ? <EmptyState title="Nenhum lançamento financeiro" description="Os pagamentos registrados aparecerão aqui." /> : (
          <div className="paymentHistoryList">
          {items.map((payment) => (
            <article className={`paymentHistoryCard ${payment.tipo === 'ESTORNO' ? 'refund' : ''}`} key={payment.id}>
              <span className="paymentHistoryIcon" aria-hidden="true">
                {payment.tipo === 'ESTORNO' ? <Undo2 size={18} /> : <Banknote size={18} />}
              </span>
              <div className="paymentHistoryMain">
                <div className="paymentHistoryTitle">
                  <h3>{payment.tipo === 'ESTORNO' ? 'Estorno' : 'Recebimento'}{payment.entregaCodigo ? ` · ${payment.entregaCodigo}` : ''}</h3>
                  <span className="paymentMethodBadge">{paymentMethodLabel(payment.formaPagamento)}</span>
                </div>
                <p>{payment.clienteNome} · {dateTime(payment.pagoEm || payment.criadoEm)}</p>
                <dl>
                  {payment.usuarioResponsavelNome ? <div><dt>Registrado por</dt><dd>{payment.usuarioResponsavelNome}</dd></div> : null}
                  {payment.tipo === 'ESTORNO' && payment.motivo ? <div><dt>Motivo</dt><dd>{payment.motivo}</dd></div> : null}
                  {payment.observacoes ? <div><dt>Observação</dt><dd>{payment.observacoes}</dd></div> : null}
                </dl>
              </div>
              <strong className="paymentHistoryValue">{payment.tipo === 'ESTORNO' ? '− ' : ''}{money(payment.valor)}</strong>
              {payment.tipo === 'RECEBIMENTO' ? <button className="paymentRefundButton" type="button" disabled={Boolean(refundIntent) || busy} onClick={() => setRefund({ payment, value: String(payment.valor), reason: '' })}><Undo2 size={15} aria-hidden="true" /> Estornar</button> : null}
            </article>
          ))}
          </div>
        )}
      </section>
      <Modal open={modalOpen} onClose={() => !busy && setModalOpen(false)} title="Novo pagamento" maxWidth={520}>
        <form onSubmit={submit} className="settingsForm">
          <label>Entrega<select value={form.entregaId} onChange={(e) => setForm({ ...form, entregaId: e.target.value })} required><option value="">Selecione</option>{deliveries.map((delivery) => <option key={delivery.id} value={delivery.id}>{delivery.codigo} - {delivery.clienteNome}</option>)}</select></label>
          <div className="formGrid"><label>Valor<input type="number" min="0.01" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required /></label><label>Forma<select value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value as FormaPagamento })}>{formas.map((forma) => <option key={forma}>{forma}</option>)}</select></label></div>

          <label>Observações<textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></label>
          <button className="primaryButton" type="submit" disabled={busy}>Revisar pagamento</button>
        </form>
      </Modal>
      <ConfirmDialog open={confirmPayment} title="Registrar pagamento?" description={`Confirme o recebimento de ${money(Number(form.valor || 0))}.`} confirmLabel="Registrar pagamento" busy={busy} onCancel={() => setConfirmPayment(false)} onConfirm={() => void register()} />
      <ConfirmDialog open={discardIntent !== null} title="Descartar tentativa pendente?" description="Confira o histórico financeiro antes de descartar. Uma tentativa já processada pode ter ficado sem resposta no navegador." confirmLabel="Descartar tentativa" busy={busy} onCancel={() => setDiscardIntent(null)} onConfirm={discardPending} />
      <Modal open={refund !== null} onClose={() => !busy && setRefund(null)} title="Registrar estorno" maxWidth={480}>
        {refund ? <form className="settingsForm" onSubmit={(e) => { e.preventDefault(); void registerRefund(); }}><label>Valor<input type="number" min="0.01" max={refund.payment.valor} step="0.01" placeholder="0,00" value={refund.value} onChange={(e) => setRefund({ ...refund, value: e.target.value })} required /></label><label>Motivo<textarea rows={3} maxLength={500} value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} required /></label><button className="dangerButton" type="submit" disabled={busy}>{busy ? 'Processando...' : 'Confirmar estorno'}</button></form> : null}
      </Modal>
    </main>
  );
}
