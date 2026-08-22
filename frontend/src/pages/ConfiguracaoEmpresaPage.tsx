import { Building2, Clock3, Contact, MapPin, Save } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { ConfiguracaoEmpresa } from '../types';
import { formatCep, formatEmailInput, formatPhone, onlyDigits } from '../utils/inputMasks';

const empty: ConfiguracaoEmpresa = { id: '', nomeFantasia: 'JS Boy', telefone: '(85) 98807-1980', whatsapp: '(85) 98807-1980', email: 'empresajsboy@gmail.com', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', horarioAtendimento: '', versao: 0 };
const placeholders: Partial<Record<keyof ConfiguracaoEmpresa, string>> = { email: 'contato@exemplo.com', telefone: '(00) 00000-0000', whatsapp: '(00) 00000-0000', cep: '00000-000', estado: 'CE', horarioAtendimento: 'Seg. a sex., das 08:00 às 18:00' };
const displayCompany = (data: ConfiguracaoEmpresa): ConfiguracaoEmpresa => ({ ...data, telefone: formatPhone(data.telefone), whatsapp: formatPhone(data.whatsapp), email: formatEmailInput(data.email), cep: formatCep(data.cep), estado: data.estado.toUpperCase().slice(0, 2) });
function formatCompanyField(key: keyof ConfiguracaoEmpresa, value: string) {
  if (key === 'telefone' || key === 'whatsapp') return formatPhone(value);
  if (key === 'email') return formatEmailInput(value);
  if (key === 'cep') return formatCep(value);
  if (key === 'estado') return value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2);
  return value;
}

export function ConfiguracaoEmpresaPage() {
  const [form, setForm] = useState<ConfiguracaoEmpresa>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setForm(displayCompany((await api.get<ConfiguracaoEmpresa>('/configuracoes/empresa')).data)); } catch (reason) { setError(apiErrorMessage(reason, 'Não foi possível carregar a configuração.')); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return; setSaving(true); setError(''); setSuccess('');
    try { const payload = { ...form, telefone: onlyDigits(form.telefone), whatsapp: onlyDigits(form.whatsapp), email: formatEmailInput(form.email), cep: onlyDigits(form.cep), estado: form.estado.toUpperCase() }; const response = await api.put<ConfiguracaoEmpresa>('/configuracoes/empresa', payload, { headers: { 'If-Match': String(form.versao) } }); setForm(displayCompany(response.data)); setSuccess('Configuração da empresa salva.'); }
    catch (reason) { setError(apiErrorMessage(reason, 'Não foi possível salvar a configuração.')); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="page"><LoadingState label="Carregando configuração..." /></main>;
  if (error && !form.id) return <main className="page"><ErrorState message={error} onRetry={() => void load()} /></main>;
  const field = (key: keyof ConfiguracaoEmpresa, label: string, required = false) => <label>{label}<input required={required} type={key === 'email' ? 'email' : key === 'telefone' || key === 'whatsapp' ? 'tel' : 'text'} inputMode={key === 'telefone' || key === 'whatsapp' ? 'tel' : key === 'email' ? 'email' : key === 'cep' ? 'numeric' : undefined} autoComplete={key === 'email' ? 'email' : key === 'telefone' ? 'tel' : key === 'cep' ? 'postal-code' : undefined} maxLength={key === 'telefone' || key === 'whatsapp' ? 15 : key === 'cep' ? 9 : key === 'estado' ? 2 : undefined} placeholder={placeholders[key]} value={String(form[key] ?? '')} onChange={(event) => setForm({ ...form, [key]: formatCompanyField(key, event.target.value) })} /></label>;

  return <main className="page">
    <div className="pageHeader"><div><h1>Empresa</h1><p>Identidade e dados de contato exibidos aos clientes nos canais da JS Boy.</p></div></div>
    <section className="infoBanner"><span className="infoBannerIcon"><Building2 size={20} /></span><div><strong>O que esta configuração controla?</strong><p>Estes dados identificam a JS Boy no portal do cliente, comprovantes, contatos e informações de atendimento. Eles não criam várias empresas no sistema.</p></div></section>
    {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}{error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
    <form className="settingsSections" onSubmit={save}>
      <section className="settingsSection"><div className="settingsSectionTitle"><Contact size={19} /><div><h2>Identidade e contato</h2><p>Como a empresa será apresentada aos clientes.</p></div></div><div className="formGrid">{field('nomeFantasia', 'Nome fantasia', true)}{field('email', 'E-mail')}{field('telefone', 'Telefone')}{field('whatsapp', 'WhatsApp')}</div></section>
      <section className="settingsSection"><div className="settingsSectionTitle"><MapPin size={19} /><div><h2>Endereço</h2><p>Localização principal da operação.</p></div></div><div className="formGrid">{field('cep', 'CEP')}{field('logradouro', 'Logradouro')}{field('numero', 'Número')}{field('complemento', 'Complemento')}{field('bairro', 'Bairro')}{field('cidade', 'Cidade')}{field('estado', 'Estado')}</div></section>
      <section className="settingsSection"><div className="settingsSectionTitle"><Clock3 size={19} /><div><h2>Atendimento</h2><p>Horário informado aos clientes.</p></div></div><div className="formGrid singleField">{field('horarioAtendimento', 'Horário de atendimento')}</div></section>
      <div className="settingsSubmit"><button className="primaryButton" type="submit" disabled={saving}><Save size={17} /> {saving ? 'Salvando...' : 'Salvar configurações'}</button></div>
    </form>
  </main>;
}
