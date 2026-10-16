import { message, useLocale } from '../i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, KeyRound, MessageCircle, Pencil, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { Modal } from '../components/Modal';
import { TableActions } from '../components/TableActions';
import { useToast } from '../contexts/ToastContext';
import { ClienteFormData, clienteSchema } from '../schemas/clienteSchema';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Cliente } from '../types';
import { titleCase } from '../utils/display';
import { formatCep, formatCpfOrCnpj, formatEmailInput, formatPhone, onlyDigits } from '../utils/inputMasks';
import { whatsappHref } from '../utils/whatsapp';

const emptyForm: ClienteFormData = {
  nome: '', telefone: '', whatsapp: '', email: '', documento: '', endereco: '', numero: 'S/N',
  semNumero: true, complemento: '', cep: '', bairro: '', cidade: '', estado: '', observacoes: '',
};
const getStepLabels = () => ([message("clientes.identificacao"), message("clientes.endereco"), message("clientes.observacoes")]);

export function ClientesPage() {
  useLocale();
  const { showToast } = useToast();
  const [items, setItems] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [statusPending, setStatusPending] = useState<Cliente | null>(null);
  const [access, setAccess] = useState<{ client: Cliente; email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema), defaultValues: emptyForm,
  });
  const noNumber = watch('semNumero');
  const documento = watch('documento');
  const telefone = watch('telefone');
  const whatsapp = watch('whatsapp');
  const email = watch('email');
  const cep = watch('cep');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems((await api.get<Cliente[]>('/clientes')).data); }
    catch (reason) { setError(apiErrorMessage(reason, message("clientes.nao.foi.possivel.carregar.os.clientes"))); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function openNew() {
    setEditing(null); reset(emptyForm); setModalStep(1); setModalOpen(true);
  }

  function openEdit(client: Cliente) {
    setEditing(client);
    reset({
      nome: client.nome, telefone: formatPhone(client.telefone), whatsapp: formatPhone(client.whatsapp || ''), email: formatEmailInput(client.email || ''),
      documento: formatCpfOrCnpj(client.documento || ''), endereco: client.logradouro || client.endereco || '', numero: client.numero || 'S/N',
      semNumero: client.semNumero ?? client.numero === 'S/N', complemento: client.complemento || '', cep: formatCep(client.cep || ''),
      bairro: client.bairro, cidade: client.cidade, estado: client.estado || '', observacoes: client.observacoes || '',
    });
    setModalStep(1); setModalOpen(true);
  }

  async function advance() {
    const fields: Array<keyof ClienteFormData> = modalStep === 1
      ? ['nome', 'documento', 'telefone', 'whatsapp', 'email']
      : ['cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado'];
    if (await trigger(fields)) setModalStep((step) => Math.min(3, step + 1));
  }

  async function save(data: ClienteFormData) {
    if (busy) return;
    setBusy(true); setError('');
    const payload = {
      ...data,
      nome: data.nome.trim(), telefone: onlyDigits(data.telefone), whatsapp: onlyDigits(data.whatsapp),
      documento: onlyDigits(data.documento), cep: onlyDigits(data.cep), email: formatEmailInput(data.email || '') || null,
      logradouro: data.endereco.trim(), numero: data.semNumero ? 'S/N' : data.numero.trim(),
      endereco: `${data.endereco.trim()}, ${data.semNumero ? 'S/N' : data.numero.trim()}`,
      estado: data.estado.trim().toUpperCase(),
    };
    try {
      if (editing) {
        await api.put(`/clientes/${editing.id}`, payload, { headers: { 'If-Match': String(editing.versao) } });
        showToast(message("clientes.cliente.atualizado.com.sucesso"), 'success');
      } else {
        await api.post('/clientes', payload);
        showToast(message("clientes.cliente.cadastrado.com.sucesso"), 'success');
      }
      setModalOpen(false); reset(emptyForm); await load();
    } catch (reason) { setError(apiErrorMessage(reason, message("clientes.nao.foi.possivel.salvar.o.cliente"))); }
    finally { setBusy(false); }
  }

  async function toggleStatus() {
    if (!statusPending || busy) return;
    setBusy(true); setError('');
    try {
      await api.patch(`/clientes/${statusPending.id}/status`, { ativo: !statusPending.ativo }, {
        headers: { 'If-Match': String(statusPending.versao) },
      });
      showToast(statusPending.ativo ? message("clientes.cliente.desativado") : message("clientes.cliente.ativado"), 'success');
      setStatusPending(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, message("clientes.nao.foi.possivel.alterar.o.cliente"))); }
    finally { setBusy(false); }
  }

  async function createAccess() {
    if (!access || busy) return;
    setBusy(true); setError('');
    try {
      await api.post(`/clientes/${access.client.id}/acesso`, { email: formatEmailInput(access.email), senha: access.password });
      showToast(message("clientes.acesso.do.cliente.criado"), 'success'); setAccess(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, message("clientes.nao.foi.possivel.criar.o.acesso"))); }
    finally { setBusy(false); }
  }

  const visible = items.filter((item) => `${item.nome} ${item.telefone} ${item.documento || ''}`.toLowerCase().includes(search.toLowerCase()));
  const fieldError = (name: keyof ClienteFormData) => errors[name]?.message ? <span className="fieldError">{message(String(errors[name]?.message))}</span> : null;

  return (
    <main className="page">
      <div className="filterBar">
        <label className="filterSearch" aria-label={message("clientes.pesquisar.clientes")}>
          <Search size={18} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={message("clientes.pesquisar.por.nome.telefone.ou.documento")} />
        </label>
        <span style={{ flex: 1 }} />
        <button className="primaryButton" type="button" onClick={openNew}><Plus size={17} /> {message("clientes.novo.cliente")}</button>
      </div>

      {loading ? <LoadingState label={message("clientes.carregando.clientes")} /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && visible.length === 0 ? <EmptyState title={message("clientes.nenhum.cliente.encontrado")} /> : null}
      {!loading && !error && visible.length > 0 ? (
        <section className="adminList">
          <div className="tableWrap">
            <table className="responsiveTable">
              <thead><tr><th>{message("clientes.cliente")}</th><th>{message("clientes.contato")}</th><th>{message("clientes.localidade")}</th><th>{message("clientes.status")}</th><th style={{ textAlign: 'right' }}>{message("clientes.acoes")}</th></tr></thead>
              <tbody>
                {visible.map((client) => (
                  <tr key={client.id}>
                    <td data-label={message("clientes.cliente")}><div className="nameCell"><span className="avatarTile tone-yellow">{titleCase(client.nome).slice(0, 2)}</span><div><div>{titleCase(client.nome)}</div><div className="cellSub">{client.possuiAcesso ? message("clientes.acesso.criado") : message("clientes.sem.acesso")}</div></div></div></td>
                    <td data-label={message("clientes.contato")}><strong className="cellPrimary">{formatPhone(client.telefone)}</strong><span className="cellSub">{client.email || message("clientes.e.mail.nao.informado")}</span></td>
                    <td data-label={message("clientes.localidade")}>{titleCase(client.cidade)} / {(client.estado || '--').toUpperCase()}</td>
                    <td data-label={message("clientes.status")}><span className={`statusBadge ${client.ativo ? 'active' : 'danger'}`}>{client.ativo ? message("clientes.ativo") : message("clientes.inativo")}</span></td>
                    <td data-label={message("clientes.acoes")}>
                      <TableActions actions={[
                        ...(whatsappHref(client.whatsapp || client.telefone, client.nome) ? [{ label: message("clientes.falar.pelo.whatsapp"), icon: <MessageCircle size={16} />, onClick: () => window.open(whatsappHref(client.whatsapp || client.telefone, client.nome), '_blank', 'noopener,noreferrer') }] : []),
                        { label: message("clientes.editar.cliente"), icon: <Pencil size={16} />, onClick: () => openEdit(client) },
                        ...(!client.possuiAcesso ? [{ label: message("clientes.criar.acesso"), icon: <KeyRound size={16} />, onClick: () => setAccess({ client, email: formatEmailInput(client.email || ''), password: '' }) }] : []),
                        { label: client.ativo ? message("clientes.desativar.cliente") : message("clientes.ativar.cliente"), icon: client.ativo ? <ToggleLeft size={16} /> : <ToggleRight size={16} />, onClick: () => setStatusPending(client), danger: client.ativo },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
        eyebrow={message("clientes.value.etapa.value.3", { value1: editing ? 'EDITAR CLIENTE' : 'NOVO CLIENTE', value2: modalStep })}
        title={getStepLabels()[modalStep - 1]}
        maxWidth={720}
        footer={<>
          <button className="secondaryButton" type="button" style={modalStep === 1 ? { visibility: 'hidden' } : undefined} onClick={() => setModalStep((step) => Math.max(1, step - 1))}><ArrowLeft size={16} /> {message("clientes.voltar")}</button>
          <div className="modalFooterActions">
            <span>{message("clientes.etapa")} {modalStep} {message("clientes.de.3")}</span>
            {modalStep < 3
              ? <button className="darkButton" type="button" onClick={() => void advance()}>{message("clientes.proximo")} <ArrowRight size={16} /></button>
              : <button className="primaryButton" form="client-form" type="submit" disabled={busy}><Check size={16} /> {busy ? message("comum.salvando") : editing ? message("clientes.salvar.cliente") : message("clientes.cadastrar.cliente")}</button>}
          </div>
        </>}
      >
        <div className="wizardStepper">{[1, 2, 3].map((step) => <span key={step} className={modalStep >= step ? 'wizardStepBar done' : 'wizardStepBar'} />)}</div>
        <div className="wizardStepLabels">{getStepLabels().map((label, index) => <span key={label} className={modalStep >= index + 1 ? 'done' : undefined}>{label}</span>)}</div>
        <form id="client-form" onSubmit={handleSubmit(save)} className="clientWizardForm">
          {modalStep === 1 ? <div className="formGrid">
            <label>{message("clientes.nome")}<input {...register('nome')} />{fieldError('nome')}</label>
            <label>{message("clientes.cpf.ou.cnpj")}<input {...register('documento')} inputMode="numeric" autoComplete="off" maxLength={18} placeholder="000.000.000-00 ou 00.000.000/0000-00" value={documento} onChange={(event) => setValue('documento', formatCpfOrCnpj(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('documento')}</label>
            <label>{message("clientes.telefone")}<input {...register('telefone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={telefone} onChange={(event) => setValue('telefone', formatPhone(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('telefone')}</label>
            <label>{message("clientes.whatsapp")}<input {...register('whatsapp')} type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={whatsapp} onChange={(event) => setValue('whatsapp', formatPhone(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('whatsapp')}</label>
            <label className="requestWide">{message("clientes.e.mail")}<input {...register('email')} type="email" inputMode="email" autoComplete="email" placeholder={message("comum.email.exemplo")} value={email} onChange={(event) => setValue('email', formatEmailInput(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('email')}</label>
          </div> : null}
          {modalStep === 2 ? <div className="formGrid">
            <label>{message("clientes.cep")}<input {...register('cep')} inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" value={cep} onChange={(event) => setValue('cep', formatCep(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('cep')}</label>
            <label>{message("clientes.endereco")}<input {...register('endereco')} />{fieldError('endereco')}</label>
            <label>{message("clientes.numero")}<input disabled={noNumber} {...register('numero')} />{fieldError('numero')}</label>
            <label className="checkboxLine wizardCheckbox"><input type="checkbox" {...register('semNumero')} /> {message("clientes.sem.numero")}</label>
            <label>{message("clientes.complemento")}<input {...register('complemento')} /></label>
            <label>{message("clientes.bairro")}<input {...register('bairro')} />{fieldError('bairro')}</label>
            <label>{message("clientes.cidade")}<input {...register('cidade')} />{fieldError('cidade')}</label>
            <label>{message("clientes.estado")}<input maxLength={2} placeholder="CE" {...register('estado', { onChange: (event) => setValue('estado', event.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2), { shouldDirty: true }) })} />{fieldError('estado')}</label>
          </div> : null}
          {modalStep === 3 ? <div className="reviewPanel">
            <div><strong>{message("clientes.cadastro.pronto.para.revisao")}</strong><span>{message("clientes.confira.os.dados.antes.de.salvar.voce.pode.voltar.para.corrigir.qual")}</span></div>
            <label>{message("clientes.observacoes")}<textarea rows={4} placeholder={message("clientes.informacoes.adicionais.sobre.o.cliente")} {...register('observacoes')} /></label>
          </div> : null}
        </form>
      </Modal>

      <ConfirmDialog open={statusPending !== null} title={message("clientes.value.cliente", { value1: message(statusPending?.ativo ? 'comum.deactivate' : 'comum.activate') })} description={message("clientes.a.mudanca.afeta.novas.operacoes.e.o.acesso.vinculado")} confirmLabel={message(statusPending?.ativo ? 'comum.deactivate' : 'comum.activate')} danger={statusPending?.ativo} busy={busy} onCancel={() => setStatusPending(null)} onConfirm={() => void toggleStatus()} />
      <Modal open={access !== null} onClose={() => !busy && setAccess(null)} title={message("clientes.criar.acesso.do.cliente")} eyebrow={message("clientes.acesso.do.cliente")} maxWidth={480}>
        {access ? <form className="settingsForm compactForm" onSubmit={(event) => { event.preventDefault(); void createAccess(); }}><label>{message("clientes.e.mail")}<input type="email" inputMode="email" autoComplete="email" placeholder={message("comum.email.exemplo")} value={access.email} onChange={(event) => setAccess({ ...access, email: formatEmailInput(event.target.value) })} required /></label><label>{message("clientes.senha.temporaria")}<input type="password" minLength={12} autoComplete="new-password" placeholder={message("clientes.minimo.de.12.caracteres")} value={access.password} onChange={(event) => setAccess({ ...access, password: event.target.value })} required /></label><p className="formHelp">{message("clientes.por.seguranca.a.senha.nao.podera.ser.consultada.depois")}</p><button className="primaryButton" type="submit" disabled={busy}><KeyRound size={16} /> {busy ? message("comum.criando") : message("clientes.criar.acesso")}</button></form> : null}
      </Modal>
    </main>
  );
}
