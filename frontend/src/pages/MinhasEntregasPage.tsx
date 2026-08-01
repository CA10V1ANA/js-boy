import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, DollarSign, FileCheck2, MapPin, PackageCheck, Search, Truck, UserPlus } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { ClienteFormData, clienteSchema } from '../schemas/clienteSchema';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { EntregaOperacional, ResumoEntregador, StatusEntrega } from '../types';
import { publicDeliveryCode, titleCase } from '../utils/display';
import { formatCep, formatCpfOrCnpj, formatEmailInput, formatPhone, onlyDigits } from '../utils/inputMasks';

const emptySummary: ResumoEntregador = { entregasAtivas: 0, emRota: 0, concluidasHoje: 0, valorMovimentadoHoje: 0, documentacaoPendente: 0 };
const emptyClient: ClienteFormData = { nome: '', telefone: '', whatsapp: '', email: '', documento: '', endereco: '', numero: 'S/N', semNumero: true, complemento: '', cep: '', bairro: '', cidade: '', estado: '', observacoes: '' };
const finished: StatusEntrega[] = ['ENTREGUE', 'DEVOLVIDA', 'FALHA_OPERACIONAL', 'CANCELADA'];

function labelStatus(value: string) { return value.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()); }
function money(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0); }
function next(status: StatusEntrega) {
  if (status === 'ENTREGADOR_DESIGNADO') return { status: 'COLETADA' as StatusEntrega, label: 'Confirmar coleta' };
  if (status === 'COLETADA') return { status: 'EM_ROTA' as StatusEntrega, label: 'Iniciar rota' };
  if (status === 'EM_ROTA') return { status: 'ENTREGUE' as StatusEntrega, label: 'Confirmar entrega' };
  return null;
}
function statusClass(status: StatusEntrega) {
  if (status === 'ENTREGUE') return 'statusBadge active';
  if (status === 'CANCELADA' || status === 'FALHA_OPERACIONAL') return 'statusBadge danger';
  if (['COLETADA', 'EM_ROTA', 'EM_DEVOLUCAO'].includes(status)) return 'statusBadge progress';
  return 'statusBadge pending';
}
type ProofDraft = { delivery: EntregaOperacional; type: 'COLETA' | 'ENTREGA'; file: File | null; receiver: string; observation: string };

export function MinhasEntregasPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<EntregaOperacional[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ATIVAS' | 'TODAS' | 'CONCLUIDAS'>('ATIVAS');
  const [pending, setPending] = useState<EntregaOperacional | null>(null);
  const [proof, setProof] = useState<ProofDraft | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientStep, setClientStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } = useForm<ClienteFormData>({ resolver: zodResolver(clienteSchema), defaultValues: emptyClient });
  const noNumber = watch('semNumero');
  const watched = { documento: watch('documento'), telefone: watch('telefone'), whatsapp: watch('whatsapp'), email: watch('email'), cep: watch('cep') };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [deliveries, resume] = await Promise.all([api.get<EntregaOperacional[]>('/entregas/minhas-entregas'), api.get<ResumoEntregador>('/operacao-entregador/resumo')]);
      setItems(deliveries.data); setSummary(resume.data);
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel carregar seu painel operacional.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => items.filter((item) => {
    const text = `${item.clienteNome} ${item.destinatarioNome} ${item.bairroDestino}`.toLowerCase();
    if (!text.includes(search.toLowerCase())) return false;
    if (filter === 'CONCLUIDAS') return item.status === 'ENTREGUE';
    if (filter === 'ATIVAS') return !finished.includes(item.status);
    return true;
  }), [filter, items, search]);

  async function advance() {
    const action = pending && next(pending.status);
    if (!pending || !action || busy) return;
    setBusy(true); setError('');
    try {
      await api.patch(`/entregas/minhas-entregas/${pending.id}/status`, { status: action.status }, { headers: { 'If-Match': String(pending.versao) } });
      showToast(`${action.label} registrada.`, 'success'); setPending(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel atualizar esta entrega.')); }
    finally { setBusy(false); }
  }

  async function submitProof(event: FormEvent) {
    event.preventDefault();
    if (!proof || busy) return;
    if (proof.type === 'ENTREGA' && !proof.receiver.trim()) { setError('Informe quem recebeu a entrega.'); return; }
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('tipo', proof.type);
      if (proof.file) body.append('arquivo', proof.file);
      if (proof.receiver.trim()) body.append('recebedorNome', proof.receiver.trim());
      if (proof.observation.trim()) body.append('observacao', proof.observation.trim());
      await api.post(`/operacao-entregador/entregas/${proof.delivery.id}/comprovantes`, body, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      showToast('Documentacao registrada com sucesso.', 'success'); setProof(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel registrar a documentacao.')); }
    finally { setBusy(false); }
  }

  async function createClient(data: ClienteFormData) {
    if (busy) return;
    setBusy(true); setError('');
    const number = data.semNumero ? 'S/N' : data.numero.trim();
    try {
      await api.post('/operacao-entregador/clientes', { ...data, nome: data.nome.trim(), telefone: onlyDigits(data.telefone), whatsapp: onlyDigits(data.whatsapp), documento: onlyDigits(data.documento), cep: onlyDigits(data.cep), email: formatEmailInput(data.email || '') || null, logradouro: data.endereco.trim(), numero: number, endereco: `${data.endereco.trim()}, ${number}`, estado: data.estado.trim().toUpperCase() });
      showToast('Cliente cadastrado na base da JS Boy.', 'success'); setClientOpen(false); setClientStep(1); reset(emptyClient);
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel cadastrar o cliente.')); }
    finally { setBusy(false); }
  }

  const fieldError = (name: keyof ClienteFormData) => errors[name]?.message ? <span className="fieldError">{String(errors[name]?.message)}</span> : null;
  const metrics = [
    ['Entregas ativas', String(summary.entregasAtivas).padStart(2, '0'), 'sob sua responsabilidade', PackageCheck, 'yellow'],
    ['Em rota', String(summary.emRota).padStart(2, '0'), 'em deslocamento agora', Truck, 'green'],
    ['Concluidas hoje', String(summary.concluidasHoje).padStart(2, '0'), 'finalizadas no dia', CheckCircle2, 'navy'],
    ['Valor movimentado', money(summary.valorMovimentadoHoje), 'nao representa comissao', DollarSign, 'blue'],
  ] as const;

  if (loading) return <main className="page"><LoadingState label="Montando seu painel operacional..." /></main>;
  if (error && items.length === 0) return <main className="page"><ErrorState message={error} onRetry={() => void load()} /></main>;
  return <main className="page rolePortal courierPortal">
    <section className="roleHero"><div><span className="modalEyebrow">PAINEL DO ENTREGADOR</span><h2>Seu dia de trabalho, em um so lugar</h2><p>Acompanhe rotas, registre comprovantes e mantenha os clientes da operacao atualizados.</p></div><div className="roleHeroActions"><button className="secondaryButton" type="button" onClick={() => { reset(emptyClient); setClientStep(1); setClientOpen(true); }}><UserPlus size={17} /> Cadastrar cliente</button><button className="primaryButton" type="button" onClick={() => document.getElementById('entregas-operacionais')?.scrollIntoView({ behavior: 'smooth' })}><Truck size={17} /> Ver entregas</button></div></section>
    {error ? <div className="portalInlineError" role="alert">{error}</div> : null}
    <section className="metricGrid roleMetricGrid" aria-label="Resumo do dia">{metrics.map(([label, value, detail, Icon, tone]) => <article className="metricCard" key={label}><span className={`metricIcon tone-${tone}`}><Icon size={19} /></span><span>{label}</span><strong className={label === 'Valor movimentado' ? 'smaller' : undefined}>{value}</strong><div className="metricDelta"><span className="vs">{detail}</span></div></article>)}</section>
    {summary.documentacaoPendente > 0 ? <section className="attentionBanner"><span className="metricIcon tone-red"><FileCheck2 size={19} /></span><div><strong>{summary.documentacaoPendente} {summary.documentacaoPendente === 1 ? 'entrega precisa' : 'entregas precisam'} de documentacao</strong><p>Registre a coleta ou a entrega antes de encerrar a etapa.</p></div></section> : null}
    <section className="panelCard" id="entregas-operacionais"><div className="panelCardHeader roleListHeader"><div><h2>Minhas entregas</h2><p>Priorize as ativas e documente cada etapa.</p></div></div><div className="roleFilters"><label className="filterSearch"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por cliente, destinatario ou bairro" /></label><div className="filterPills">{([['ATIVAS', 'Ativas'], ['TODAS', 'Todas'], ['CONCLUIDAS', 'Concluidas']] as const).map(([value, label]) => <button key={value} className={`filterPill ${filter === value ? 'active' : ''}`} type="button" onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      {visible.length === 0 ? <EmptyState title="Nenhuma entrega neste filtro" /> : <div className="roleDeliveryList">{visible.map((delivery, index) => { const action = next(delivery.status); return <article className="roleDeliveryCard" key={delivery.id}><div className="roleDeliveryMain"><span className="publicRecordCode">{publicDeliveryCode(index)}</span><div><strong>{titleCase(delivery.destinatarioNome)}</strong><p><MapPin size={14} /> {titleCase(delivery.bairroOrigem)} para {titleCase(delivery.bairroDestino)}</p></div></div><div className="roleDeliveryMeta"><div><span>Cliente</span><strong>{titleCase(delivery.clienteNome)}</strong></div><div><span>Destino</span><strong>{delivery.enderecoDestino}</strong></div><div><span>Valor</span><strong>{money(delivery.valorFinal)}</strong></div><span className={statusClass(delivery.status)}>{labelStatus(delivery.status)}</span></div><div className="roleDeliveryActions">{!finished.includes(delivery.status) ? <button className="secondaryButton" type="button" onClick={() => setProof({ delivery, type: delivery.status === 'EM_ROTA' ? 'ENTREGA' : 'COLETA', file: null, receiver: '', observation: '' })}><Camera size={16} /> Documentar</button> : null}{action ? <button className="darkButton" type="button" onClick={() => setPending(delivery)}>{action.label} <ArrowRight size={16} /></button> : null}</div></article>; })}</div>}
    </section>
    <ConfirmDialog open={pending !== null} title={`${pending ? next(pending.status)?.label : 'Atualizar entrega'}?`} description="Confirme apenas depois da etapa. Para finalizar, o comprovante e obrigatorio." confirmLabel={pending ? next(pending.status)?.label : 'Confirmar'} busy={busy} onCancel={() => setPending(null)} onConfirm={() => void advance()} />
    <Modal open={proof !== null} onClose={() => !busy && setProof(null)} eyebrow="DOCUMENTACAO DA ENTREGA" title={proof?.type === 'ENTREGA' ? 'Comprovante de entrega' : 'Comprovante de coleta'} maxWidth={560}>{proof ? <form className="settingsForm proofForm" onSubmit={submitProof}>{error ? <div className="portalInlineError" role="alert">{error}</div> : null}<div className="proofDeliverySummary"><span>Entrega selecionada</span><strong>{titleCase(proof.delivery.destinatarioNome)}</strong><small>{proof.delivery.enderecoDestino}</small></div><label>Tipo<select value={proof.type} onChange={(event) => setProof({ ...proof, type: event.target.value as 'COLETA' | 'ENTREGA' })}><option value="COLETA">Coleta</option><option value="ENTREGA">Entrega</option></select></label>{proof.type === 'ENTREGA' ? <label>Quem recebeu<input required value={proof.receiver} onChange={(event) => setProof({ ...proof, receiver: event.target.value })} placeholder="Nome da pessoa que recebeu" /></label> : null}<label>Foto ou PDF<input required type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setProof({ ...proof, file: event.target.files?.[0] || null })} /><span className="formHelp">Arquivo de ate 5 MB.</span></label><label>Observacao<textarea rows={3} maxLength={500} value={proof.observation} onChange={(event) => setProof({ ...proof, observation: event.target.value })} /></label><button className="primaryButton" type="submit" disabled={busy}><FileCheck2 size={16} /> {busy ? 'Registrando...' : 'Registrar documentacao'}</button></form> : null}</Modal>
    <Modal open={clientOpen} onClose={() => !busy && setClientOpen(false)} eyebrow={`CADASTRAR CLIENTE Ã‚Â· ETAPA ${clientStep}/2`} title={clientStep === 1 ? 'Identificacao e contato' : 'Endereco do cliente'} maxWidth={720} footer={<><button className="secondaryButton" type="button" style={clientStep === 1 ? { visibility: 'hidden' } : undefined} onClick={() => setClientStep(1)}><ArrowLeft size={16} /> Voltar</button><div className="modalFooterActions"><span>Etapa {clientStep} de 2</span>{clientStep === 1 ? <button className="darkButton" type="button" onClick={() => void trigger(['nome', 'documento', 'telefone', 'whatsapp', 'email']).then((ok) => ok && setClientStep(2))}>Proximo <ArrowRight size={16} /></button> : <button className="primaryButton" form="courier-client-form" type="submit" disabled={busy}><Check size={16} /> Cadastrar cliente</button>}</div></>}>{error ? <div className="portalInlineError" role="alert">{error}</div> : null}<div className="wizardStepper"><span className="wizardStepBar done" /><span className={`wizardStepBar ${clientStep === 2 ? 'done' : ''}`} /></div><form id="courier-client-form" onSubmit={handleSubmit(createClient)} className="clientWizardForm">{clientStep === 1 ? <div className="formGrid"><label>Nome<input {...register('nome')} />{fieldError('nome')}</label><label>CPF ou CNPJ<input {...register('documento')} inputMode="numeric" maxLength={18} placeholder="000.000.000-00" value={watched.documento} onChange={(event) => setValue('documento', formatCpfOrCnpj(event.target.value), { shouldValidate: true })} />{fieldError('documento')}</label><label>Telefone<input {...register('telefone')} type="tel" maxLength={15} placeholder="(00) 00000-0000" value={watched.telefone} onChange={(event) => setValue('telefone', formatPhone(event.target.value), { shouldValidate: true })} />{fieldError('telefone')}</label><label>WhatsApp<input {...register('whatsapp')} type="tel" maxLength={15} placeholder="(00) 00000-0000" value={watched.whatsapp} onChange={(event) => setValue('whatsapp', formatPhone(event.target.value), { shouldValidate: true })} />{fieldError('whatsapp')}</label><label className="requestWide">E-mail<input {...register('email')} type="email" placeholder="nome@exemplo.com" value={watched.email} onChange={(event) => setValue('email', formatEmailInput(event.target.value), { shouldValidate: true })} />{fieldError('email')}</label></div> : <div className="formGrid"><label>CEP<input {...register('cep')} maxLength={9} placeholder="00000-000" value={watched.cep} onChange={(event) => setValue('cep', formatCep(event.target.value), { shouldValidate: true })} />{fieldError('cep')}</label><label>Endereco<input {...register('endereco')} />{fieldError('endereco')}</label><label>Numero<input disabled={noNumber} {...register('numero')} />{fieldError('numero')}</label><label className="checkboxLine wizardCheckbox"><input type="checkbox" {...register('semNumero')} /> Sem numero</label><label>Complemento<input {...register('complemento')} /></label><label>Bairro<input {...register('bairro')} />{fieldError('bairro')}</label><label>Cidade<input {...register('cidade')} />{fieldError('cidade')}</label><label>Estado<input maxLength={2} placeholder="CE" {...register('estado')} />{fieldError('estado')}</label><label className="requestWide">Observacoes<textarea rows={3} {...register('observacoes')} /></label></div>}</form></Modal>
  </main>;
}
