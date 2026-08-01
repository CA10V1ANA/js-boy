import { ArrowLeft, ArrowRight, Building2, CalendarClock, Check, CreditCard, FileCheck2, Headphones, Mail, MapPin, Package, Phone, Plus, Route, Truck, User } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Cliente, ConfiguracaoEmpresa, EntregaCliente, Pagamento, StatusEntrega } from '../types';
import type { Comprovante, Parada, SolicitacaoEntrega } from '../types/p2';
import { publicDeliveryCode, titleCase } from '../utils/display';
import { formatCpfOrCnpj, formatPhone } from '../utils/inputMasks';

type PortalData = { cliente: Cliente; entregas: EntregaCliente[]; pagamentos: Pagamento[]; contato: ConfiguracaoEmpresa };
type Detail = { paradas: Parada[]; comprovantes: Comprovante[] };
type Tab = 'RESUMO' | 'ENTREGAS' | 'CONTA';
const emptyRequest: SolicitacaoEntrega = { enderecoOrigem: '', bairroOrigem: '', enderecoDestino: '', bairroDestino: '', destinatarioNome: '', destinatarioTelefone: '', descricaoMercadoria: '', observacoes: '', distanciaKm: 0 };
const finalStatuses: StatusEntrega[] = ['ENTREGUE', 'DEVOLVIDA', 'FALHA_OPERACIONAL', 'CANCELADA'];
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const statusLabel = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
function statusClass(status: StatusEntrega) {
  if (status === 'ENTREGUE') return 'statusBadge active';
  if (status === 'CANCELADA' || status === 'FALHA_OPERACIONAL') return 'statusBadge danger';
  if (['COLETADA', 'EM_ROTA', 'EM_DEVOLUCAO'].includes(status)) return 'statusBadge progress';
  return 'statusBadge pending';
}

export function ClientePortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [tab, setTab] = useState<Tab>('RESUMO');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestStep, setRequestStep] = useState(1);
  const [request, setRequest] = useState(emptyRequest);
  const [sending, setSending] = useState(false);
  const [detail, setDetail] = useState<Record<string, Detail>>({});
  const [detailLoading, setDetailLoading] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [cliente, entregas, pagamentos, contato] = await Promise.all([
        api.get<Cliente>('/cliente/me'), api.get<EntregaCliente[]>('/cliente/entregas'),
        api.get<Pagamento[]>('/cliente/pagamentos'), api.get<ConfiguracaoEmpresa>('/cliente/contato'),
      ]);
      setData({ cliente: cliente.data, entregas: entregas.data, pagamentos: pagamentos.data, contato: contato.data });
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel carregar seu portal.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true); setFeedback('');
    try {
      await api.post('/cliente/entregas', { ...request, distanciaKm: Number(request.distanciaKm), fusoHorario: request.agendadaInicio ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined, agendadaInicio: request.agendadaInicio ? new Date(request.agendadaInicio).toISOString() : undefined, agendadaFim: request.agendadaFim ? new Date(request.agendadaFim).toISOString() : undefined });
      setRequest(emptyRequest); setRequestOpen(false); setRequestStep(1);
      setFeedback('Solicitacao recebida. A JS Boy fara a analise antes de confirmar a entrega.');
      await load();
    } catch (reason) { setFeedback(apiErrorMessage(reason, 'Nao foi possivel enviar a solicitacao.')); }
    finally { setSending(false); }
  }

  function openRequest() {
    setRequest(emptyRequest);
    setRequestStep(1);
    setFeedback('');
    setRequestOpen(true);
  }

  function advanceRequest() {
    if (requestStep === 1 && (!request.enderecoOrigem.trim() || !request.bairroOrigem.trim()
      || !request.enderecoDestino.trim() || !request.bairroDestino.trim())) {
      setFeedback('Preencha os enderecos e bairros da rota antes de continuar.');
      return;
    }
    if (requestStep === 2 && (!request.destinatarioNome.trim()
      || request.destinatarioTelefone.replace(/\D/g, '').length < 10
      || !request.descricaoMercadoria.trim())) {
      setFeedback('Preencha o destinatario, um telefone valido e a mercadoria antes de continuar.');
      return;
    }
    setFeedback('');
    setRequestStep((step) => Math.min(3, step + 1));
  }
  async function loadDetail(deliveryId: string) {
    if (detailLoading) return;
    if (detail[deliveryId]) { setDetail((current) => { const copy = { ...current }; delete copy[deliveryId]; return copy; }); return; }
    setDetailLoading(deliveryId);
    try {
      const [stops, proofs] = await Promise.all([api.get<Parada[]>(`/cliente/entregas/${deliveryId}/paradas`), api.get<Comprovante[]>(`/cliente/entregas/${deliveryId}/comprovantes`)]);
      setDetail((current) => ({ ...current, [deliveryId]: { paradas: stops.data, comprovantes: proofs.data } }));
    } catch (reason) { setFeedback(apiErrorMessage(reason, 'Nao foi possivel carregar os detalhes.')); }
    finally { setDetailLoading(''); }
  }

  function openProof(deliveryId: string, proofId: string) {
    void api.get(`/comprovantes/${deliveryId}/${proofId}/arquivo`, { responseType: 'blob' }).then((response) => window.open(URL.createObjectURL(response.data), '_blank', 'noopener'));
  }

  const summary = useMemo(() => {
    const deliveries = data?.entregas || [];
    const payments = data?.pagamentos || [];
    return {
      total: deliveries.length,
      active: deliveries.filter((item) => !finalStatuses.includes(item.status)).length,
      route: deliveries.filter((item) => ['COLETADA', 'EM_ROTA'].includes(item.status)).length,
      delivered: deliveries.filter((item) => item.status === 'ENTREGUE').length,
      paid: payments.reduce((sum, item) => sum + (item.tipo === 'ESTORNO' ? -item.valor : item.valor), 0),
    };
  }, [data]);

  if (loading) return <main className="page"><LoadingState label="Montando seu portal..." /></main>;
  if (error || !data) return <main className="page"><ErrorState message={error || 'Nao foi possivel carregar seu portal.'} onRetry={() => void load()} /></main>;
  const address = [data.cliente.logradouro || data.cliente.endereco, data.cliente.numero, data.cliente.bairro, data.cliente.cidade, data.cliente.estado].filter(Boolean).join(', ');
  const companyAddress = [data.contato.logradouro, data.contato.numero, data.contato.bairro, data.contato.cidade, data.contato.estado].filter(Boolean).join(', ');

  const deliveryList = (deliveries: EntregaCliente[]) => deliveries.length === 0 ? <EmptyState title="Nenhuma entrega vinculada" description="Suas solicitacoes e entregas aparecerao aqui." /> : <div className="roleDeliveryList clientDeliveryList">{deliveries.map((delivery, index) => <article className="roleDeliveryCard" key={delivery.id}>
    <div className="roleDeliveryMain"><span className="publicRecordCode">{publicDeliveryCode(index)}</span><div><strong>{titleCase(delivery.destinatarioNome)}</strong><p><MapPin size={14} /> {titleCase(delivery.bairroOrigem)} para {titleCase(delivery.bairroDestino)}</p></div></div>
    <div className="roleDeliveryMeta clientDeliveryMeta"><div><span>Criada em</span><strong>{date(delivery.criadoEm)}</strong></div><div><span>Mercadoria</span><strong>{delivery.descricaoMercadoria}</strong></div><div><span>Valor</span><strong>{money(delivery.valorFinal)}</strong></div><span className={statusClass(delivery.status)}>{statusLabel(delivery.status)}</span></div>
    <div className="roleDeliveryActions"><button className="secondaryButton" type="button" disabled={detailLoading === delivery.id} onClick={() => void loadDetail(delivery.id)}><Route size={16} /> {detail[delivery.id] ? 'Ocultar detalhes' : detailLoading === delivery.id ? 'Carregando...' : 'Acompanhar entrega'}</button></div>
    {detail[delivery.id] ? <div className="clientDeliveryDetail"><div className="deliveryTimeline">{detail[delivery.id].paradas.map((stop) => <div key={stop.id}><span className={stop.status === 'CONCLUIDA' ? 'done' : ''} /><div><strong>{stop.ordem}. {statusLabel(stop.tipo)}</strong><small>{stop.endereco} Ã‚Â· {statusLabel(stop.status)}</small></div></div>)}</div><div className="proofLinks">{detail[delivery.id].comprovantes.length ? detail[delivery.id].comprovantes.map((proof) => <button key={proof.id} className="proofLink" type="button" onClick={() => openProof(delivery.id, proof.id)}><FileCheck2 size={16} /> Comprovante de {statusLabel(proof.tipo)}</button>) : <span>Nenhum comprovante disponivel.</span>}</div></div> : null}
  </article>)}</div>;

  return <main className="page rolePortal clientPortalV2">
    {feedback ? <FeedbackMessage tone={feedback.startsWith('Solicitacao') ? 'success' : 'error'}>{feedback}</FeedbackMessage> : null}
    <section className="roleHero clientRoleHero"><div><span className="modalEyebrow">PORTAL DO CLIENTE</span><h2>Ola, {titleCase(data.cliente.nome).split(' ')[0]}</h2><p>Solicite, acompanhe e consulte os comprovantes das suas entregas.</p></div><button className="primaryButton" type="button" onClick={openRequest}><Plus size={17} /> Solicitar entrega</button></section>
    <nav className="portalTabs" aria-label="Secoes do portal">{([['RESUMO', 'Visao geral', Package], ['ENTREGAS', 'Minhas entregas', Truck], ['CONTA', 'Minha conta', User]] as const).map(([value, label, Icon]) => <button key={value} className={tab === value ? 'active' : ''} type="button" onClick={() => setTab(value)}><Icon size={16} /> {label}</button>)}</nav>

    {tab === 'RESUMO' ? <><section className="metricGrid roleMetricGrid"><article className="metricCard"><span className="metricIcon tone-yellow"><Package size={19} /></span><span>Solicitacoes ativas</span><strong>{String(summary.active).padStart(2, '0')}</strong><div className="metricDelta"><span className="vs">em analise ou operacao</span></div></article><article className="metricCard"><span className="metricIcon tone-green"><Truck size={19} /></span><span>Em rota</span><strong>{String(summary.route).padStart(2, '0')}</strong><div className="metricDelta"><span className="vs">a caminho agora</span></div></article><article className="metricCard"><span className="metricIcon tone-navy"><Check size={19} /></span><span>Entregues</span><strong>{String(summary.delivered).padStart(2, '0')}</strong><div className="metricDelta"><span className="vs">de {summary.total} entregas</span></div></article><article className="metricCard"><span className="metricIcon tone-blue"><CreditCard size={19} /></span><span>Total pago</span><strong className="smaller">{money(summary.paid)}</strong><div className="metricDelta"><span className="vs">historico financeiro</span></div></article></section><section className="panelCard"><div className="panelCardHeader roleListHeader"><div><h2>Entregas recentes</h2><p>Veja rapidamente o andamento das ultimas solicitacoes.</p></div><button className="smallButton" type="button" onClick={() => setTab('ENTREGAS')}>Ver todas</button></div>{deliveryList(data.entregas.slice(0, 3))}</section></> : null}
    {tab === 'ENTREGAS' ? <section className="panelCard"><div className="panelCardHeader roleListHeader"><div><h2>Minhas entregas</h2><p>Historico, andamento e documentos da operacao.</p></div><button className="primaryButton" type="button" onClick={openRequest}><Plus size={16} /> Nova solicitacao</button></div>{deliveryList(data.entregas)}</section> : null}
    {tab === 'CONTA' ? <div className="clientAccountGrid"><section className="panelCard portalAccount"><div className="panelCardHeader"><div><span className="modalEyebrow">DADOS DO CLIENTE</span><h2>{titleCase(data.cliente.nome)}</h2></div><Building2 size={23} /></div><dl className="portalDetails"><div><dt>E-mail</dt><dd>{data.cliente.email || 'Nao informado'}</dd></div><div><dt>Telefone</dt><dd>{formatPhone(data.cliente.telefone)}</dd></div><div><dt>Documento</dt><dd>{data.cliente.documento ? formatCpfOrCnpj(data.cliente.documento) : 'Nao informado'}</dd></div><div><dt>Endereco</dt><dd>{address || 'Nao informado'}</dd></div></dl></section><section className="panelCard contactCard"><div className="panelCardHeader"><div><span className="modalEyebrow">PRECISA DE AJUDA?</span><h2>Contato da JS Boy</h2></div><Headphones size={22} /></div><ul className="portalContacts">{data.contato.telefone ? <li><Phone size={17} /><a href={`tel:${data.contato.telefone}`}>{formatPhone(data.contato.telefone)}</a></li> : null}{data.contato.whatsapp ? <li><Phone size={17} /><a href={`https://wa.me/${data.contato.whatsapp}`}>WhatsApp</a></li> : null}{data.contato.email ? <li><Mail size={17} /><a href={`mailto:${data.contato.email}`}>{data.contato.email}</a></li> : null}{companyAddress ? <li><MapPin size={17} />{companyAddress}</li> : null}</ul></section><section className="panelCard accountPayments"><div className="panelCardHeader"><h2>Pagamentos</h2></div>{data.pagamentos.length ? <div className="portalPayments">{data.pagamentos.map((payment) => <article key={payment.id}><div><strong>Pagamento da entrega</strong><span>{date(payment.pagoEm)} Ã‚Â· {statusLabel(payment.formaPagamento)}</span></div><strong>{payment.tipo === 'ESTORNO' ? '-' : ''}{money(payment.valor)}</strong></article>)}</div> : <EmptyState title="Nenhum pagamento vinculado" />}</section></div> : null}

    <Modal open={requestOpen} onClose={() => !sending && setRequestOpen(false)} eyebrow={`SOLICITAR ENTREGA Ã‚Â· ETAPA ${requestStep}/3`} title={requestStep === 1 ? 'Rota da entrega' : requestStep === 2 ? 'Destinatario e mercadoria' : 'Agendamento e revisao'} maxWidth={760} footer={<><button className="secondaryButton" type="button" style={requestStep === 1 ? { visibility: 'hidden' } : undefined} onClick={() => setRequestStep((step) => Math.max(1, step - 1))}><ArrowLeft size={16} /> Voltar</button><div className="modalFooterActions"><span>Etapa {requestStep} de 3</span>{requestStep < 3 ? <button className="darkButton" type="button" onClick={advanceRequest}>Proximo <ArrowRight size={16} /></button> : <button className="primaryButton" form="client-request-form" type="submit" disabled={sending}><Check size={16} /> {sending ? 'Enviando...' : 'Enviar solicitacao'}</button>}</div></>}>{feedback && !feedback.startsWith('Solicitacao') ? <div className="portalInlineError" role="alert">{feedback}</div> : null}<div className="wizardStepper"><span className="wizardStepBar done" /><span className={`wizardStepBar ${requestStep >= 2 ? 'done' : ''}`} /><span className={`wizardStepBar ${requestStep === 3 ? 'done' : ''}`} /></div><form id="client-request-form" className="clientWizardForm" onSubmit={submit}>
      {requestStep === 1 ? <div className="formGrid"><label>Endereco de origem<input required value={request.enderecoOrigem} onChange={(event) => setRequest({ ...request, enderecoOrigem: event.target.value })} /></label><label>Bairro da origem<input required value={request.bairroOrigem} onChange={(event) => setRequest({ ...request, bairroOrigem: event.target.value })} /></label><label>Endereco de destino<input required value={request.enderecoDestino} onChange={(event) => setRequest({ ...request, enderecoDestino: event.target.value })} /></label><label>Bairro do destino<input required value={request.bairroDestino} onChange={(event) => setRequest({ ...request, bairroDestino: event.target.value })} /></label><label className="requestWide">Distancia estimada (km)<input required min="0" step="0.1" type="number" placeholder="0,0" value={request.distanciaKm || ''} onChange={(event) => setRequest({ ...request, distanciaKm: Number(event.target.value) })} /><span className="formHelp">A JS Boy revisara o valor antes de confirmar.</span></label></div> : null}
      {requestStep === 2 ? <div className="formGrid"><label>Destinatario<input required value={request.destinatarioNome} onChange={(event) => setRequest({ ...request, destinatarioNome: event.target.value })} /></label><label>Telefone autorizado<input required type="tel" maxLength={15} placeholder="(00) 00000-0000" value={request.destinatarioTelefone} onChange={(event) => setRequest({ ...request, destinatarioTelefone: formatPhone(event.target.value) })} /></label><label className="requestWide">Mercadoria<input required maxLength={255} value={request.descricaoMercadoria} onChange={(event) => setRequest({ ...request, descricaoMercadoria: event.target.value })} /></label></div> : null}
      {requestStep === 3 ? <div className="formGrid"><label><CalendarClock size={15} /> Inicio agendado (opcional)<input type="datetime-local" value={request.agendadaInicio || ''} onChange={(event) => setRequest({ ...request, agendadaInicio: event.target.value })} /></label><label><CalendarClock size={15} /> Fim agendado (opcional)<input type="datetime-local" value={request.agendadaFim || ''} onChange={(event) => setRequest({ ...request, agendadaFim: event.target.value })} /></label><label className="requestWide">Observacoes<textarea rows={4} maxLength={500} value={request.observacoes} onChange={(event) => setRequest({ ...request, observacoes: event.target.value })} /></label><div className="requestReview requestWide"><strong>Como funciona</strong><span>A solicitacao entra como Ã¢â‚¬Å“SolicitadaÃ¢â‚¬Â. A JS Boy revisa rota, disponibilidade e valor antes de confirmar.</span></div></div> : null}
    </form></Modal>
  </main>;
}
