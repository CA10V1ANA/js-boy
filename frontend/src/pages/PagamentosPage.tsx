import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
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
const money = (value: number) => new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat(getLocale(), {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value));
const paymentMethodLabel = (value: FormaPagamento) => ({
  PIX: message("pagamento.pix.2"), DINHEIRO: message("pagamento.dinheiro"), CARTAO: message("pagamento.cartao"), BOLETO: message("pagamentos.boleto"),
  TRANSFERENCIA: message("pagamento.transferencia"), OUTRO: message("pagamentos.outro"),
})[value];

export function PagamentosPage() {
  useLocale();
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
      setError(apiErrorMessage(reason, message("pagamento.nao.foi.possivel.carregar.os.dados.financeiros")));
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
      setSuccess(message("pagamento.pagamento.registrado")); setForm(emptyForm);
      await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, message("pagamento.resultado.do.pagamento.nao.confirmado.reenvie.a.tentativa.pendente")));
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
      setError(reason instanceof Error ? reason.message : message("pagamento.nao.foi.possivel.preparar.o.pagamento"));
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
      setSuccess(message("pagamento.estorno.registrado")); await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, message("pagamento.resultado.do.estorno.nao.confirmado.reenvie.a.tentativa.pendente")));
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
      setError(reason instanceof Error ? reason.message : message("pagamento.nao.foi.possivel.preparar.o.estorno"));
    }
  }

  function discardPending() {
    if (discardIntent === 'payment') { clearPaymentIntent(); setPaymentIntent(null); }
    if (discardIntent === 'refund') { clearRefundIntent(); setRefundIntent(null); }
    setDiscardIntent(null);
    setError('');
  }

  if (loading) return <main className="page"><LoadingState label={message("pagamento.carregando.financeiro")} /></main>;
  if (error && items.length === 0 && deliveries.length === 0 && !paymentIntent && !refundIntent) {
    return <main className="page"><ErrorState message={error} onRetry={() => void load()} /></main>;
  }

  return (
    <main className="page paymentsPage">
      <header className="paymentsToolbar">
        <div>
          <span className="paymentsEyebrow">{message("pagamento.controle.financeiro")}</span>
          <h1>{message("pagamento.visao.financeira")}</h1>
          <p>{message("pagamento.acompanhe.valores.recebidos.saldos.em.aberto.e.o.historico.de.movime")}</p>
        </div>
        <button className="primaryButton" type="button" disabled={Boolean(paymentIntent) || busy} onClick={() => setModalOpen(true)}><Plus size={17} /> {message("pagamento.novo.pagamento")}</button>
      </header>
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
      {paymentIntent ? <div className="infoBanner"><div><strong>{message("pagamento.pagamento.pendente.de.confirmacao")}</strong><p>{message("pagamento.reenvie.a.mesma.tentativa.de")} {money(paymentIntent.payload.valor)}{message("pagamento.antes.de.descarta.la.confira.o.historico.para.evitar.duplicidade")}</p></div><button type="button" disabled={busy} onClick={() => void sendPayment(paymentIntent)}>{message("pagamento.reenviar.pagamento.pendente")}</button><button type="button" disabled={busy} onClick={() => setDiscardIntent('payment')}>{message("pagamento.descartar.tentativa")}</button></div> : null}
      {refundIntent ? <div className="infoBanner"><div><strong>{message("pagamento.estorno.pendente.de.confirmacao")}</strong><p>{message("pagamento.reenvie.a.mesma.tentativa.de")} {money(refundIntent.payload.valor)}{message("pagamento.antes.de.descarta.la.confira.o.historico")}</p></div><button type="button" disabled={busy} onClick={() => void sendRefund(refundIntent)}>{message("pagamento.reenviar.estorno.pendente")}</button><button type="button" disabled={busy} onClick={() => setDiscardIntent('refund')}>{message("pagamento.descartar.tentativa")}</button></div> : null}
      <section className="paymentsMetricGrid" aria-label={message("pagamento.resumo.financeiro")}>
        <article className="paymentMetricCard">
          <span className="paymentMetricIcon neutral"><WalletCards size={19} aria-hidden="true" /></span>
          <div><span>{message("pagamento.total.em.entregas")}</span><strong>{money(report.valorEntregas)}</strong><small>{message("pagamento.valor.contratado")}</small></div>
        </article>
        <article className="paymentMetricCard received">
          <span className="paymentMetricIcon"><CircleCheckBig size={19} aria-hidden="true" /></span>
          <div><span>{message("pagamento.recebido.liquido")}</span><strong>{money(report.valorRecebido)}</strong><small>{message("pagamento.valores.confirmados")}</small></div>
        </article>
        <article className="paymentMetricCard pending">
          <span className="paymentMetricIcon"><Clock3 size={19} aria-hidden="true" /></span>
          <div><span>{message("pagamento.saldo.pendente")}</span><strong>{money(report.valorPendente)}</strong><small>{report.pendencias.length} {report.pendencias.length === 1 ? message("pagamento.entrega.em.aberto") : message("pagamento.entregas.em.aberto")}</small></div>
        </article>
        <article className="paymentMetricCard">
          <span className="paymentMetricIcon neutral"><ReceiptText size={19} aria-hidden="true" /></span>
          <div><span>{message("pagamento.lancamentos")}</span><strong>{report.pagamentosRegistrados}</strong><small>{message("pagamento.recebimentos.registrados")}</small></div>
        </article>
      </section>

      {report.pendencias.length > 0 ? (
        <section className="paymentsSection" aria-labelledby="pending-payments-title">
          <div className="paymentsSectionHeader">
            <div>
              <span className="paymentsEyebrow">{message("pagamento.operacao.em.aberto")}</span>
              <h2 id="pending-payments-title">{message("pagamento.recebimentos.pendentes")}</h2>
              <p>{message("pagamento.confira.a.rota.o.recebedor.e.o.saldo.antes.de.regularizar.cada.entre")}</p>
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
                      <span>{message("pagamento.entrega")} {pending.entregaCodigo}</span>
                      <h3 id={`pending-${pending.entregaId}`}>{pending.clienteNome}</h3>
                    </div>
                  </div>
                  <dl className="paymentPendingAmounts">
                    <div><dt>{message("pagamento.valor.da.entrega")}</dt><dd>{money(pending.valorEntrega)}</dd></div>
                    <div><dt>{message("pagamento.ja.recebido")}</dt><dd>{money(pending.valorPago)}</dd></div>
                    <div className="highlight"><dt>{message("pagamento.saldo.pendente")}</dt><dd>{money(pending.valorPendente)}</dd></div>
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
            <span className="paymentsEyebrow">{message("pagamento.movimentacoes")}</span>
            <h2 id="payment-history-title">{message("pagamento.historico.de.lancamentos")}</h2>
            <p>{message("pagamento.recebimentos.e.estornos.registrados.na.operacao")}</p>
          </div>
          <span className="paymentsCount neutral">{items.length}</span>
        </div>
        {items.length === 0 ? <EmptyState title={message("pagamento.nenhum.lancamento.financeiro")} description={message("pagamento.os.pagamentos.registrados.aparecerao.aqui")} /> : (
          <div className="paymentHistoryList">
          {items.map((payment) => (
            <article className={`paymentHistoryCard ${payment.tipo === 'ESTORNO' ? 'refund' : ''}`} key={payment.id}>
              <span className="paymentHistoryIcon" aria-hidden="true">
                {payment.tipo === 'ESTORNO' ? <Undo2 size={18} /> : <Banknote size={18} />}
              </span>
              <div className="paymentHistoryMain">
                <div className="paymentHistoryTitle">
                  <h3>{payment.tipo === 'ESTORNO' ? message("pagamentos.estorno") : message("pagamentos.recebimento")}{payment.entregaCodigo ? (" " + message("pagamento.value", { value1: payment.entregaCodigo })) : ''}</h3>
                  <span className="paymentMethodBadge">{paymentMethodLabel(payment.formaPagamento)}</span>
                </div>
                <p>{payment.clienteNome} · {dateTime(payment.pagoEm || payment.criadoEm)}</p>
                <dl>
                  {payment.usuarioResponsavelNome ? <div><dt>{message("pagamento.registrado.por")}</dt><dd>{payment.usuarioResponsavelNome}</dd></div> : null}
                  {payment.tipo === 'ESTORNO' && payment.motivo ? <div><dt>{message("pagamentos.motivo")}</dt><dd>{payment.motivo}</dd></div> : null}
                  {payment.observacoes ? <div><dt>{message("pagamento.observacao")}</dt><dd>{payment.observacoes}</dd></div> : null}
                </dl>
              </div>
              <strong className="paymentHistoryValue">{payment.tipo === 'ESTORNO' ? '− ' : ''}{money(payment.valor)}</strong>
              {payment.tipo === 'RECEBIMENTO' ? <button className="paymentRefundButton" type="button" disabled={Boolean(refundIntent) || busy} onClick={() => setRefund({ payment, value: String(payment.valor), reason: '' })}><Undo2 size={15} aria-hidden="true" /> {message("pagamentos.estornar")}</button> : null}
            </article>
          ))}
          </div>
        )}
      </section>
      <Modal open={modalOpen} onClose={() => !busy && setModalOpen(false)} title={message("pagamento.novo.pagamento")} maxWidth={520}>
        <form onSubmit={submit} className="settingsForm">
          <label>{message("pagamento.entrega")}<select value={form.entregaId} onChange={(e) => setForm({ ...form, entregaId: e.target.value })} required><option value="">{message("pagamentos.selecione")}</option>{deliveries.map((delivery) => <option key={delivery.id} value={delivery.id}>{delivery.codigo} - {delivery.clienteNome}</option>)}</select></label>
          <div className="formGrid"><label>{message("pagamento.valor")}<input type="number" min="0.01" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required /></label><label>{message("pagamentos.forma")}<select value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value as FormaPagamento })}>{formas.map((forma) => <option key={forma}>{forma}</option>)}</select></label></div>

          <label>{message("pagamento.observacoes")}<textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></label>
          <button className="primaryButton" type="submit" disabled={busy}>{message("pagamento.revisar.pagamento")}</button>
        </form>
      </Modal>
      <ConfirmDialog open={confirmPayment} title={message("pagamento.registrar.pagamento")} description={message("pagamento.confirme.o.recebimento.de.value", { value1: money(Number(form.valor || 0)) })} confirmLabel={message("pagamento.registrar.pagamento.2")} busy={busy} onCancel={() => setConfirmPayment(false)} onConfirm={() => void register()} />
      <ConfirmDialog open={discardIntent !== null} title={message("pagamento.descartar.tentativa.pendente")} description={message("pagamento.confira.o.historico.financeiro.antes.de.descartar.uma.tentativa.ja.p")} confirmLabel={message("pagamento.descartar.tentativa")} busy={busy} onCancel={() => setDiscardIntent(null)} onConfirm={discardPending} />
      <Modal open={refund !== null} onClose={() => !busy && setRefund(null)} title={message("pagamento.registrar.estorno")} maxWidth={480}>
        {refund ? <form className="settingsForm" onSubmit={(e) => { e.preventDefault(); void registerRefund(); }}><label>{message("pagamento.valor")}<input type="number" min="0.01" max={refund.payment.valor} step="0.01" placeholder="0,00" value={refund.value} onChange={(e) => setRefund({ ...refund, value: e.target.value })} required /></label><label>{message("pagamentos.motivo")}<textarea rows={3} maxLength={500} value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} required /></label><button className="dangerButton" type="submit" disabled={busy}>{busy ? message("comum.processando") : message("pagamento.confirmar.estorno")}</button></form> : null}
      </Modal>
    </main>
  );
}
