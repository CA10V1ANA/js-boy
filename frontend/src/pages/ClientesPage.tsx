import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, KeyRound, Pencil, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
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

const emptyForm: ClienteFormData = {
  nome: '', telefone: '', whatsapp: '', email: '', documento: '', endereco: '', numero: 'S/N',
  semNumero: true, complemento: '', cep: '', bairro: '', cidade: '', estado: '', observacoes: '',
};
const stepLabels = ['Identificacao', 'Endereco', 'Observacoes'];

export function ClientesPage() {
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
    catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel carregar os clientes.')); }
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
        showToast('Cliente atualizado com sucesso.', 'success');
      } else {
        await api.post('/clientes', payload);
        showToast('Cliente cadastrado com sucesso.', 'success');
      }
      setModalOpen(false); reset(emptyForm); await load();
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel salvar o cliente.')); }
    finally { setBusy(false); }
  }

  async function toggleStatus() {
    if (!statusPending || busy) return;
    setBusy(true); setError('');
    try {
      await api.patch(`/clientes/${statusPending.id}/status`, { ativo: !statusPending.ativo }, {
        headers: { 'If-Match': String(statusPending.versao) },
      });
      showToast(statusPending.ativo ? 'Cliente desativado.' : 'Cliente ativado.', 'success');
      setStatusPending(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel alterar o cliente.')); }
    finally { setBusy(false); }
  }

  async function createAccess() {
    if (!access || busy) return;
    setBusy(true); setError('');
    try {
      await api.post(`/clientes/${access.client.id}/acesso`, { email: formatEmailInput(access.email), senha: access.password });
      showToast('Acesso do cliente criado.', 'success'); setAccess(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel criar o acesso.')); }
    finally { setBusy(false); }
  }

  const visible = items.filter((item) => `${item.nome} ${item.telefone} ${item.documento || ''}`.toLowerCase().includes(search.toLowerCase()));
  const fieldError = (name: keyof ClienteFormData) => errors[name]?.message ? <span className="fieldError">{String(errors[name]?.message)}</span> : null;

  return (
    <main className="page">
      <div className="filterBar">
        <label className="filterSearch" aria-label="Pesquisar clientes">
          <Search size={18} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome, telefone ou documento" />
        </label>
        <span style={{ flex: 1 }} />
        <button className="primaryButton" type="button" onClick={openNew}><Plus size={17} /> Novo cliente</button>
      </div>

      {loading ? <LoadingState label="Carregando clientes..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && visible.length === 0 ? <EmptyState title="Nenhum cliente encontrado" /> : null}
      {!loading && !error && visible.length > 0 ? (
        <section className="adminList">
          <div className="tableWrap">
            <table className="responsiveTable">
              <thead><tr><th>Cliente</th><th>Contato</th><th>Localidade</th><th>Status</th><th style={{ textAlign: 'right' }}>Acoes</th></tr></thead>
              <tbody>
                {visible.map((client) => (
                  <tr key={client.id}>
                    <td data-label="Cliente"><div className="nameCell"><span className="avatarTile tone-yellow">{titleCase(client.nome).slice(0, 2)}</span><div><div>{titleCase(client.nome)}</div><div className="cellSub">{client.possuiAcesso ? 'Acesso criado' : 'Sem acesso'}</div></div></div></td>
                    <td data-label="Contato"><strong className="cellPrimary">{formatPhone(client.telefone)}</strong><span className="cellSub">{client.email || 'E-mail nao informado'}</span></td>
                    <td data-label="Localidade">{titleCase(client.cidade)} / {(client.estado || '--').toUpperCase()}</td>
                    <td data-label="Status"><span className={`statusBadge ${client.ativo ? 'active' : 'danger'}`}>{client.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td data-label="Acoes">
                      <TableActions actions={[
                        { label: 'Editar cliente', icon: <Pencil size={16} />, onClick: () => openEdit(client) },
                        ...(!client.possuiAcesso ? [{ label: 'Criar acesso', icon: <KeyRound size={16} />, onClick: () => setAccess({ client, email: formatEmailInput(client.email || ''), password: '' }) }] : []),
                        { label: client.ativo ? 'Desativar cliente' : 'Ativar cliente', icon: client.ativo ? <ToggleLeft size={16} /> : <ToggleRight size={16} />, onClick: () => setStatusPending(client), danger: client.ativo },
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
        eyebrow={`${editing ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'} · ETAPA ${modalStep}/3`}
        title={stepLabels[modalStep - 1]}
        maxWidth={720}
        footer={<>
          <button className="secondaryButton" type="button" style={modalStep === 1 ? { visibility: 'hidden' } : undefined} onClick={() => setModalStep((step) => Math.max(1, step - 1))}><ArrowLeft size={16} /> Voltar</button>
          <div className="modalFooterActions">
            <span>Etapa {modalStep} de 3</span>
            {modalStep < 3
              ? <button className="darkButton" type="button" onClick={() => void advance()}>Proximo <ArrowRight size={16} /></button>
              : <button className="primaryButton" form="client-form" type="submit" disabled={busy}><Check size={16} /> {busy ? 'Salvando...' : editing ? 'Salvar cliente' : 'Cadastrar cliente'}</button>}
          </div>
        </>}
      >
        <div className="wizardStepper">{[1, 2, 3].map((step) => <span key={step} className={modalStep >= step ? 'wizardStepBar done' : 'wizardStepBar'} />)}</div>
        <div className="wizardStepLabels">{stepLabels.map((label, index) => <span key={label} className={modalStep >= index + 1 ? 'done' : undefined}>{label}</span>)}</div>
        <form id="client-form" onSubmit={handleSubmit(save)} className="clientWizardForm">
          {modalStep === 1 ? <div className="formGrid">
            <label>Nome<input {...register('nome')} />{fieldError('nome')}</label>
            <label>CPF ou CNPJ<input {...register('documento')} inputMode="numeric" autoComplete="off" maxLength={18} placeholder="000.000.000-00 ou 00.000.000/0000-00" value={documento} onChange={(event) => setValue('documento', formatCpfOrCnpj(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('documento')}</label>
            <label>Telefone<input {...register('telefone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={telefone} onChange={(event) => setValue('telefone', formatPhone(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('telefone')}</label>
            <label>WhatsApp<input {...register('whatsapp')} type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={whatsapp} onChange={(event) => setValue('whatsapp', formatPhone(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('whatsapp')}</label>
            <label className="requestWide">E-mail<input {...register('email')} type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com" value={email} onChange={(event) => setValue('email', formatEmailInput(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('email')}</label>
          </div> : null}
          {modalStep === 2 ? <div className="formGrid">
            <label>CEP<input {...register('cep')} inputMode="numeric" autoComplete="postal-code" maxLength={9} placeholder="00000-000" value={cep} onChange={(event) => setValue('cep', formatCep(event.target.value), { shouldDirty: true, shouldValidate: true })} />{fieldError('cep')}</label>
            <label>Endereco<input {...register('endereco')} />{fieldError('endereco')}</label>
            <label>Numero<input disabled={noNumber} {...register('numero')} />{fieldError('numero')}</label>
            <label className="checkboxLine wizardCheckbox"><input type="checkbox" {...register('semNumero')} /> Sem numero</label>
            <label>Complemento<input {...register('complemento')} /></label>
            <label>Bairro<input {...register('bairro')} />{fieldError('bairro')}</label>
            <label>Cidade<input {...register('cidade')} />{fieldError('cidade')}</label>
            <label>Estado<input maxLength={2} placeholder="CE" {...register('estado', { onChange: (event) => setValue('estado', event.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2), { shouldDirty: true }) })} />{fieldError('estado')}</label>
          </div> : null}
          {modalStep === 3 ? <div className="reviewPanel">
            <div><strong>Cadastro pronto para revisao</strong><span>Confira os dados antes de salvar. Voce pode voltar para corrigir qualquer informacao.</span></div>
            <label>Observacoes<textarea rows={4} placeholder="Informacoes adicionais sobre o cliente" {...register('observacoes')} /></label>
          </div> : null}
        </form>
      </Modal>

      <ConfirmDialog open={statusPending !== null} title={`${statusPending?.ativo ? 'Desativar' : 'Ativar'} cliente?`} description="A mudanca afeta novas operacoes e o acesso vinculado." confirmLabel={statusPending?.ativo ? 'Desativar' : 'Ativar'} danger={statusPending?.ativo} busy={busy} onCancel={() => setStatusPending(null)} onConfirm={() => void toggleStatus()} />
      <Modal open={access !== null} onClose={() => !busy && setAccess(null)} title="Criar acesso do cliente" eyebrow="ACESSO DO CLIENTE" maxWidth={480}>
        {access ? <form className="settingsForm compactForm" onSubmit={(event) => { event.preventDefault(); void createAccess(); }}><label>E-mail<input type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com" value={access.email} onChange={(event) => setAccess({ ...access, email: formatEmailInput(event.target.value) })} required /></label><label>Senha temporaria<input type="password" minLength={8} autoComplete="new-password" placeholder="Minimo de 8 caracteres" value={access.password} onChange={(event) => setAccess({ ...access, password: event.target.value })} required /></label><p className="formHelp">Por seguranca, a senha nao podera ser consultada depois.</p><button className="primaryButton" type="submit" disabled={busy}><KeyRound size={16} /> {busy ? 'Criando...' : 'Criar acesso'}</button></form> : null}
      </Modal>
    </main>
  );
}