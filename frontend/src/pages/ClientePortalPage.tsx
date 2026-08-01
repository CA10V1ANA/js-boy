import { Building2, CreditCard, FileCheck2, Mail, MapPin, Package, Phone, Plus, Route } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Cliente, ConfiguracaoEmpresa, Entrega, Pagamento } from '../types';
import type { Comprovante, Parada, SolicitacaoEntrega } from '../types/p2';
import { formatCpfOrCnpj, formatPhone, onlyDigits } from '../utils/inputMasks';

type PortalData = { cliente: Cliente; entregas: Entrega[]; pagamentos: Pagamento[]; contato: ConfiguracaoEmpresa };
type Detail = { paradas: Parada[]; comprovantes: Comprovante[] };
const emptyRequest: SolicitacaoEntrega = {
  enderecoOrigem: '', bairroOrigem: '', enderecoDestino: '', bairroDestino: '',
  destinatarioNome: '', destinatarioTelefone: '', descricaoMercadoria: '',
  observacoes: '', distanciaKm: 0,
};
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const statusLabel = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

export function ClientePortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(emptyRequest);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [detail, setDetail] = useState<Record<string, Detail>>({});
  const [detailLoading, setDetailLoading] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [cliente, entregas, pagamentos, contato] = await Promise.all([
        api.get<Cliente>('/cliente/me'), api.get<Entrega[]>('/cliente/entregas'),
        api.get<Pagamento[]>('/cliente/pagamentos'), api.get<ConfiguracaoEmpresa>('/cliente/contato'),
      ]);
      setData({ cliente: cliente.data, entregas: entregas.data, pagamentos: pagamentos.data, contato: contato.data });
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Não foi possível carregar sua conta.'));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true); setFeedback('');
    try {
      await api.post('/cliente/entregas', {
        ...request,
        distanciaKm: Number(request.distanciaKm),
        fusoHorario: request.agendadaInicio ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
        agendadaInicio: request.agendadaInicio ? new Date(request.agendadaInicio).toISOString() : undefined,
        agendadaFim: request.agendadaFim ? new Date(request.agendadaFim).toISOString() : undefined,
      });
      setRequest(emptyRequest);
      setFeedback('Solicitação recebida. A JS Boy fará a análise antes de confirmar a entrega.');
      await load();
    } catch (reason) {
      setFeedback(apiErrorMessage(reason, 'Não foi possível enviar a solicitação.'));
    } finally { setSending(false); }
  }

  async function loadDetail(deliveryId: string) {
    if (detail[deliveryId] || detailLoading) return;
    setDetailLoading(deliveryId);
    try {
      const [paradas, comprovantes] = await Promise.all([
        api.get<Parada[]>(`/cliente/entregas/${deliveryId}/paradas`),
        api.get<Comprovante[]>(`/cliente/entregas/${deliveryId}/comprovantes`),
      ]);
      setDetail((current) => ({ ...current, [deliveryId]: { paradas: paradas.data, comprovantes: comprovantes.data } }));
    } catch (reason) {
      setFeedback(apiErrorMessage(reason, 'Não foi possível carregar os detalhes.'));
    } finally { setDetailLoading(''); }
  }

  if (loading) return <main className="page"><LoadingState label="Carregando sua conta..." /></main>;
  if (error || !data) return <main className="page"><ErrorState message={error || 'Não foi possível carregar sua conta.'} onRetry={() => void load()} /></main>;
  const address = [data.cliente.logradouro || data.cliente.endereco, data.cliente.numero, data.cliente.bairro, data.cliente.cidade, data.cliente.estado].filter(Boolean).join(', ');
  const companyAddress = [data.contato.logradouro, data.contato.numero, data.contato.bairro, data.contato.cidade, data.contato.estado].filter(Boolean).join(', ');

  return (
    <main className="page clientPortal">
      {feedback ? <FeedbackMessage tone={feedback.startsWith('Solicitação') ? 'success' : 'error'}>{feedback}</FeedbackMessage> : null}
      <section className="portalAccount panelCard">
        <div className="panelCardHeader"><div><span className="modalEyebrow">MINHA CONTA</span><h2>{data.cliente.nome}</h2></div><Building2 size={24} /></div>
        <dl className="portalDetails">
          {data.cliente.email ? <div><dt>E-mail</dt><dd>{data.cliente.email}</dd></div> : null}
          <div><dt>Telefone</dt><dd>{formatPhone(data.cliente.telefone)}</dd></div>
          {data.cliente.documento ? <div><dt>Documento</dt><dd>{formatCpfOrCnpj(data.cliente.documento)}</dd></div> : null}
          {address ? <div><dt>Endereço</dt><dd>{address}</dd></div> : null}
        </dl>
      </section>

      <section className="panelCard">
        <div className="panelCardHeader"><h2><Plus size={18} /> Solicitar entrega</h2></div>
        <p>A solicitação será criada como “Solicitada” e analisada pela JS Boy.</p>
        <form className="requestGrid" onSubmit={submit}>
          <label>Origem<input required value={request.enderecoOrigem} onChange={(e) => setRequest({ ...request, enderecoOrigem: e.target.value })} /></label>
          <label>Bairro da origem<input required value={request.bairroOrigem} onChange={(e) => setRequest({ ...request, bairroOrigem: e.target.value })} /></label>
          <label>Destino<input required value={request.enderecoDestino} onChange={(e) => setRequest({ ...request, enderecoDestino: e.target.value })} /></label>
          <label>Bairro do destino<input required value={request.bairroDestino} onChange={(e) => setRequest({ ...request, bairroDestino: e.target.value })} /></label>
          <label>Destinatário<input required value={request.destinatarioNome} onChange={(e) => setRequest({ ...request, destinatarioNome: e.target.value })} /></label>
          <label>Telefone autorizado<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={request.destinatarioTelefone} onChange={(e) => setRequest({ ...request, destinatarioTelefone: formatPhone(e.target.value) })} /></label>
          <label>Mercadoria<input required maxLength={255} value={request.descricaoMercadoria} onChange={(e) => setRequest({ ...request, descricaoMercadoria: e.target.value })} /></label>
          <label>Distância estimada (km)<input required min="0" step="0.1" type="number" placeholder="0,0" value={request.distanciaKm || ''} onChange={(e) => setRequest({ ...request, distanciaKm: Number(e.target.value) })} /></label>
          <label>Início agendado (opcional)<input type="datetime-local" value={request.agendadaInicio || ''} onChange={(e) => setRequest({ ...request, agendadaInicio: e.target.value })} /></label>
          <label>Fim agendado (opcional)<input type="datetime-local" value={request.agendadaFim || ''} onChange={(e) => setRequest({ ...request, agendadaFim: e.target.value })} /></label>
          <label className="requestWide">Observações<textarea maxLength={500} value={request.observacoes} onChange={(e) => setRequest({ ...request, observacoes: e.target.value })} /></label>
          <button className="primaryButton requestWide" type="submit" disabled={sending}>{sending ? 'Enviando...' : 'Enviar solicitação'}</button>
        </form>
      </section>

      <section className="panelCard">
        <div className="panelCardHeader"><h2><Package size={18} /> Minhas entregas</h2></div>
        {data.entregas.length === 0 ? <EmptyState title="Nenhuma entrega vinculada" /> : (
          <div className="deliveryCards portalDeliveries">{data.entregas.map((delivery) => (
            <article className="deliveryCard" key={delivery.id}>
              <div><span>{delivery.codigo}</span><strong>{delivery.destinatarioNome}</strong><p>{delivery.enderecoDestino}, {delivery.bairroDestino}</p></div>
              <dl><div><dt>Status</dt><dd>{statusLabel(delivery.status)}</dd></div><div><dt>Criada em</dt><dd>{date(delivery.criadoEm)}</dd></div><div><dt>Valor</dt><dd>{money(delivery.valorFinal)}</dd></div></dl>
              <button className="secondaryButton" type="button" disabled={detailLoading === delivery.id} onClick={() => void loadDetail(delivery.id)}>
                <Route size={16} /> {detailLoading === delivery.id ? 'Carregando...' : 'Ver paradas e comprovantes'}
              </button>
              {detail[delivery.id] ? (
                <div className="deliveryDetail">
                  <ol>{detail[delivery.id].paradas.map((stop) => <li key={stop.id}><strong>{stop.ordem}. {statusLabel(stop.tipo)}</strong><span>{stop.endereco} · {statusLabel(stop.status)}</span></li>)}</ol>
                  {detail[delivery.id].comprovantes.length ? detail[delivery.id].comprovantes.map((proof) => (
                    <a key={proof.id} href={`/comprovantes/${delivery.id}/${proof.id}/arquivo`} onClick={(event) => {
                      event.preventDefault();
                      void api.get(`/comprovantes/${delivery.id}/${proof.id}/arquivo`, { responseType: 'blob' }).then((response) => window.open(URL.createObjectURL(response.data), '_blank', 'noopener'));
                    }}><FileCheck2 size={16} /> Comprovante de {statusLabel(proof.tipo)}</a>
                  )) : <span>Nenhum comprovante disponível.</span>}
                </div>
              ) : null}
            </article>
          ))}</div>
        )}
      </section>

      <section className="panelCard">
        <div className="panelCardHeader"><h2><CreditCard size={18} /> Meus pagamentos</h2></div>
        {data.pagamentos.length === 0 ? <EmptyState title="Nenhum pagamento vinculado" /> : (
          <div className="portalPayments">{data.pagamentos.map((payment) => (
            <article key={payment.id}><div><strong>Pagamento da entrega</strong><span>{date(payment.pagoEm)} · {payment.formaPagamento} · {payment.tipo}</span></div><strong>{payment.tipo === 'ESTORNO' ? '-' : ''}{money(payment.valor)}</strong></article>
          ))}</div>
        )}
      </section>
      <section className="panelCard">
        <div className="panelCardHeader"><h2>Contato da JS Boy</h2></div>
        <ul className="portalContacts">
          {data.contato.telefone ? <li><Phone size={17} /><a href={`tel:${data.contato.telefone}`}>{formatPhone(data.contato.telefone)}</a></li> : null}
          {data.contato.whatsapp ? <li><Phone size={17} /><a href={`https://wa.me/${data.contato.whatsapp}`}>WhatsApp</a></li> : null}
          {data.contato.email ? <li><Mail size={17} /><a href={`mailto:${data.contato.email}`}>{data.contato.email}</a></li> : null}
          {companyAddress ? <li><MapPin size={17} />{companyAddress}</li> : null}
        </ul>
      </section>
    </main>
  );
}
