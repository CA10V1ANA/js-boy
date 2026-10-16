import { message, useLocale } from '../i18n';
import { Building2, Clock3, Contact, MapPin, Save } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { ConfiguracaoEmpresa } from '../types';
import { formatCep, formatEmailInput, formatPhone, onlyDigits } from '../utils/inputMasks';

const empty: ConfiguracaoEmpresa = { id: '', nomeFantasia: 'JS Boy', telefone: '(85) 98807-1980', whatsapp: '(85) 98807-1980', email: 'empresajsboy@gmail.com', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', horarioAtendimento: '', versao: 0 };
const getPlaceholders = (): Partial<Record<keyof ConfiguracaoEmpresa, string>> => ({ email: message('comum.contato.email.exemplo'), telefone: '(00) 00000-0000', whatsapp: '(00) 00000-0000', cep: '00000-000', estado: 'CE', horarioAtendimento: message("empresa.configuracao.seg.a.sex.das.08.00.as.18.00") });
const displayCompany = (data: ConfiguracaoEmpresa): ConfiguracaoEmpresa => ({
  ...data,
  telefone: formatPhone(data.telefone ?? ''),
  whatsapp: formatPhone(data.whatsapp ?? ''),
  email: formatEmailInput(data.email ?? ''),
  cep: formatCep(data.cep ?? ''),
  logradouro: data.logradouro ?? '',
  numero: data.numero ?? '',
  complemento: data.complemento ?? '',
  bairro: data.bairro ?? '',
  cidade: data.cidade ?? '',
  estado: (data.estado ?? '').toUpperCase().slice(0, 2),
  horarioAtendimento: data.horarioAtendimento ?? '',
});
function formatCompanyField(key: keyof ConfiguracaoEmpresa, value: string) {
  if (key === 'telefone' || key === 'whatsapp') return formatPhone(value);
  if (key === 'email') return formatEmailInput(value);
  if (key === 'cep') return formatCep(value);
  if (key === 'estado') return value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2);
  return value;
}

export function ConfiguracaoEmpresaPage() {
  useLocale();
  const [form, setForm] = useState<ConfiguracaoEmpresa>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setForm(displayCompany((await api.get<ConfiguracaoEmpresa>('/configuracoes/empresa')).data)); } catch (reason) { setError(apiErrorMessage(reason, message("empresa.configuracao.nao.foi.possivel.carregar.a.configuracao"))); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return; setSaving(true); setError(''); setSuccess('');
    try { const payload = { ...form, telefone: onlyDigits(form.telefone), whatsapp: onlyDigits(form.whatsapp), email: formatEmailInput(form.email), cep: onlyDigits(form.cep), estado: form.estado.toUpperCase() }; const response = await api.put<ConfiguracaoEmpresa>('/configuracoes/empresa', payload, { headers: { 'If-Match': String(form.versao) } }); setForm(displayCompany(response.data)); setSuccess(message("empresa.configuracao.configuracao.da.empresa.salva")); }
    catch (reason) { setError(apiErrorMessage(reason, message("empresa.configuracao.nao.foi.possivel.salvar.a.configuracao"))); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="page"><LoadingState label={message("empresa.configuracao.carregando.configuracao")} /></main>;
  if (error && !form.id) return <main className="page"><ErrorState message={error} onRetry={() => void load()} /></main>;
  const field = (key: keyof ConfiguracaoEmpresa, label: string, required = false) => <label>{label}<input required={required} type={key === 'email' ? 'email' : key === 'telefone' || key === 'whatsapp' ? 'tel' : 'text'} inputMode={key === 'telefone' || key === 'whatsapp' ? 'tel' : key === 'email' ? 'email' : key === 'cep' ? 'numeric' : undefined} autoComplete={key === 'email' ? 'email' : key === 'telefone' ? 'tel' : key === 'cep' ? 'postal-code' : undefined} maxLength={key === 'telefone' || key === 'whatsapp' ? 15 : key === 'cep' ? 9 : key === 'estado' ? 2 : undefined} placeholder={getPlaceholders()[key]} value={String(form[key] ?? '')} onChange={(event) => setForm({ ...form, [key]: formatCompanyField(key, event.target.value) })} /></label>;

  return <main className="page">
    <div className="pageHeader"><div><h1>{message("empresa.configuracao.empresa")}</h1><p>{message("empresa.configuracao.identidade.e.dados.de.contato.exibidos.aos.clientes.nos.canais.da.js")}</p></div></div>
    <section className="infoBanner"><span className="infoBannerIcon"><Building2 size={20} /></span><div><strong>{message("empresa.configuracao.o.que.esta.configuracao.controla")}</strong><p>{message("empresa.configuracao.estes.dados.identificam.a.js.boy.no.portal.do.cliente.comprovantes.c")}</p></div></section>
    {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}{error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
    <form className="settingsSections" onSubmit={save}>
      <section className="settingsSection"><div className="settingsSectionTitle"><Contact size={19} /><div><h2>{message("empresa.configuracao.identidade.e.contato")}</h2><p>{message("empresa.configuracao.como.a.empresa.sera.apresentada.aos.clientes")}</p></div></div><div className="formGrid">{field('nomeFantasia', message("empresa.configuracao.nome.fantasia"), true)}{field('email', message("empresa.configuracao.e.mail"))}{field('telefone', message("empresa.configuracao.telefone"))}{field('whatsapp', message("empresa.configuracao.whatsapp"))}</div></section>
      <section className="settingsSection"><div className="settingsSectionTitle"><MapPin size={19} /><div><h2>{message("empresa.configuracao.endereco")}</h2><p>{message("empresa.configuracao.localizacao.principal.da.operacao")}</p></div></div><div className="formGrid">{field('cep', message("empresa.configuracao.cep"))}{field('logradouro', message("empresa.configuracao.logradouro"))}{field('numero', message("empresa.configuracao.numero"))}{field('complemento', message("empresa.configuracao.complemento"))}{field('bairro', message("empresa.configuracao.bairro"))}{field('cidade', message("empresa.configuracao.cidade"))}{field('estado', message("empresa.configuracao.estado"))}</div></section>
      <section className="settingsSection"><div className="settingsSectionTitle"><Clock3 size={19} /><div><h2>{message("empresa.configuracao.atendimento")}</h2><p>{message("empresa.configuracao.horario.informado.aos.clientes")}</p></div></div><div className="formGrid singleField">{field('horarioAtendimento', message("empresa.configuracao.horario.de.atendimento"))}</div></section>
      <div className="settingsSubmit"><button className="primaryButton" type="submit" disabled={saving}><Save size={17} /> {saving ? message("comum.salvando") : message("empresa.configuracao.salvar.configuracoes")}</button></div>
    </form>
  </main>;
}
