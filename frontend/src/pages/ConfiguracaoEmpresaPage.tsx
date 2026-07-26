import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { ConfiguracaoEmpresa } from '../types';

const empty: ConfiguracaoEmpresa = {
  id: '', nomeFantasia: 'JS Boy', telefone: '', whatsapp: '', email: '', cep: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  horarioAtendimento: '', versao: 0,
};

export function ConfiguracaoEmpresaPage() {
  const [form, setForm] = useState<ConfiguracaoEmpresa>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setForm((await api.get<ConfiguracaoEmpresa>('/configuracoes/empresa')).data);
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel carregar a configuracao.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.put<ConfiguracaoEmpresa>('/configuracoes/empresa', form, {
        headers: { 'If-Match': String(form.versao) },
      });
      setForm(response.data);
      setSuccess('Configuracao da empresa salva.');
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel salvar a configuracao.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="page"><LoadingState label="Carregando configuracao..." /></main>;
  if (error && !form.id) return <main className="page"><ErrorState message={error} onRetry={() => void load()} /></main>;

  const field = (key: keyof ConfiguracaoEmpresa, label: string, required = false) => (
    <label>{label}<input required={required} value={String(form[key] ?? '')} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>
  );

  return (
    <main className="page">
      <div className="pageHeader"><div><h1>Empresa</h1><p>Dados exibidos ao cliente quando configurados.</p></div></div>
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
      <form className="panelCard settingsForm" onSubmit={save}>
        <div className="formGrid">
          {field('nomeFantasia', 'Nome fantasia', true)}
          {field('email', 'E-mail')}
          {field('telefone', 'Telefone')}
          {field('whatsapp', 'WhatsApp')}
          {field('cep', 'CEP')}
          {field('logradouro', 'Logradouro')}
          {field('numero', 'Numero')}
          {field('complemento', 'Complemento')}
          {field('bairro', 'Bairro')}
          {field('cidade', 'Cidade')}
          {field('estado', 'Estado')}
          {field('horarioAtendimento', 'Horario de atendimento')}
        </div>
        <button className="primaryButton" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
      </form>
    </main>
  );
}
