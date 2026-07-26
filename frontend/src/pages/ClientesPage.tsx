import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { ClienteFormData, clienteSchema } from '../schemas/clienteSchema';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Cliente } from '../types';

const emptyForm: ClienteFormData = {
  nome: '', telefone: '', whatsapp: '', email: '', documento: '', endereco: '', numero: 'S/N',
  semNumero: true, complemento: '', cep: '', bairro: '', cidade: '', estado: '', observacoes: '',
};
const onlyDigits = (value: string) => value.replace(/\D/g, '');

export function ClientesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [statusPending, setStatusPending] = useState<Cliente | null>(null);
  const [access, setAccess] = useState<{ client: Cliente; email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema), defaultValues: emptyForm,
  });
  const noNumber = watch('semNumero');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems((await api.get<Cliente[]>('/clientes')).data); }
    catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel carregar os clientes.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function openNew() {
    setEditing(null); reset(emptyForm); setModalOpen(true);
  }
  function openEdit(client: Cliente) {
    setEditing(client);
    reset({
      nome: client.nome, telefone: client.telefone, whatsapp: client.whatsapp || '', email: client.email || '',
      documento: client.documento || '', endereco: client.logradouro || client.endereco || '', numero: client.numero || 'S/N',
      semNumero: client.semNumero ?? client.numero === 'S/N', complemento: client.complemento || '', cep: client.cep || '',
      bairro: client.bairro, cidade: client.cidade, estado: client.estado || '', observacoes: client.observacoes || '',
    });
    setModalOpen(true);
  }

  async function save(data: ClienteFormData) {
    if (busy) return;
    setBusy(true); setError('');
    const payload = {
      ...data,
      nome: data.nome.trim(), telefone: onlyDigits(data.telefone), whatsapp: onlyDigits(data.whatsapp),
      documento: onlyDigits(data.documento), cep: onlyDigits(data.cep), email: (data.email || '').trim().toLowerCase() || null,
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
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel salvar o cliente.'));
    } finally { setBusy(false); }
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
      await api.post(`/clientes/${access.client.id}/acesso`, { email: access.email.trim().toLowerCase(), senha: access.password });
      showToast('Acesso do cliente criado.', 'success'); setAccess(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel criar o acesso.')); }
    finally { setBusy(false); }
  }

  const visible = items.filter((item) => `${item.nome} ${item.telefone} ${item.documento || ''}`.toLowerCase().includes(search.toLowerCase()));
  const fieldError = (name: keyof ClienteFormData) => errors[name]?.message ? <span className="fieldError">{String(errors[name]?.message)}</span> : null;

  return (
    <main className="page">
      <div className="filterBar">
        <label className="searchField">Buscar<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, telefone ou documento" /></label>
        <button className="primaryButton" type="button" onClick={openNew}><Plus size={17} /> Novo cliente</button>
      </div>
      {loading ? <LoadingState label="Carregando clientes..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && visible.length === 0 ? <EmptyState title="Nenhum cliente encontrado" /> : null}
      {!loading && !error ? (
        <section className="responsiveList">
          {visible.map((client) => (
            <article className="userCard" key={client.id}>
              <div><strong>{client.nome}</strong><span>{client.telefone} · {client.cidade}/{client.estado || '--'}</span></div>
              <span className={`statusBadge ${client.ativo ? 'active' : ''}`}>{client.ativo ? 'Ativo' : 'Inativo'}</span>
              <div className="rowActions">
                <button type="button" onClick={() => openEdit(client)}>Editar</button>
                {!client.possuiAcesso ? <button type="button" onClick={() => setAccess({ client, email: client.email || '', password: '' })}>Criar acesso</button> : null}
                <button type="button" onClick={() => setStatusPending(client)}>{client.ativo ? 'Desativar' : 'Ativar'}</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      <Modal open={modalOpen} onClose={() => !busy && setModalOpen(false)} title={editing ? 'Editar cliente' : 'Novo cliente'} maxWidth={760}>
        <form onSubmit={handleSubmit(save)} className="settingsForm">
          <div className="formGrid">
            <label>Nome<input {...register('nome')} />{fieldError('nome')}</label>
            <label>CPF ou CNPJ<input inputMode="numeric" {...register('documento')} />{fieldError('documento')}</label>
            <label>Telefone<input inputMode="tel" {...register('telefone')} />{fieldError('telefone')}</label>
            <label>WhatsApp<input inputMode="tel" {...register('whatsapp')} />{fieldError('whatsapp')}</label>
            <label>E-mail<input type="email" {...register('email')} />{fieldError('email')}</label>
            <label>CEP<input inputMode="numeric" {...register('cep')} />{fieldError('cep')}</label>
            <label>Endereco<input {...register('endereco')} />{fieldError('endereco')}</label>
            <label>Numero<input disabled={noNumber} {...register('numero')} />{fieldError('numero')}</label>
            <label className="checkboxLine"><input type="checkbox" {...register('semNumero')} /> Sem numero</label>
            <label>Complemento<input {...register('complemento')} /></label>
            <label>Bairro<input {...register('bairro')} />{fieldError('bairro')}</label>
            <label>Cidade<input {...register('cidade')} />{fieldError('cidade')}</label>
            <label>Estado<input maxLength={2} {...register('estado')} />{fieldError('estado')}</label>
          </div>
          <label>Observacoes<textarea rows={3} {...register('observacoes')} /></label>
          <button className="primaryButton" type="submit" disabled={busy}>{busy ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}</button>
        </form>
      </Modal>
      <ConfirmDialog
        open={statusPending !== null}
        title={`${statusPending?.ativo ? 'Desativar' : 'Ativar'} cliente?`}
        description="A mudanca afeta novas operacoes e o acesso vinculado."
        confirmLabel={statusPending?.ativo ? 'Desativar' : 'Ativar'}
        danger={statusPending?.ativo}
        busy={busy}
        onCancel={() => setStatusPending(null)}
        onConfirm={() => void toggleStatus()}
      />
      <Modal open={access !== null} onClose={() => !busy && setAccess(null)} title="Criar acesso do cliente" maxWidth={480}>
        {access ? <form className="settingsForm" onSubmit={(e) => { e.preventDefault(); void createAccess(); }}><label>E-mail<input type="email" value={access.email} onChange={(e) => setAccess({ ...access, email: e.target.value })} required /></label><label>Senha temporaria<input type="password" minLength={8} value={access.password} onChange={(e) => setAccess({ ...access, password: e.target.value })} required /></label><button className="primaryButton" type="submit" disabled={busy}>{busy ? 'Criando...' : 'Criar acesso'}</button></form> : null}
      </Modal>
    </main>
  );
}
