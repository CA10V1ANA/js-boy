import { useEffect, useState } from 'react';
import { BadgeCheck, Bike, CircleAlert, Mail, Save, UserRound, WalletCards } from 'lucide-react';
import { message, useLocale } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { SegurancaConta } from '../components/SegurancaConta';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import type { Entregador, TipoChavePix } from '../types';
import { domainLabel } from '../i18n/domain';
import { titleCase } from '../utils/display';
import { formatCpf, formatEmailInput, formatPhone, formatVehiclePlate, normalizeVehiclePlate, onlyDigits } from '../utils/inputMasks';

function draft(perfil: Entregador) {
  return { nome: perfil.nome, email: perfil.email || '', telefone: formatPhone(perfil.telefone),
    placaVeiculo: formatVehiclePlate(perfil.placaVeiculo), tipoChavePix: (perfil.tipoChavePix || '') as TipoChavePix | '',
    chavePix: perfil.chavePix || '', titularPix: perfil.titularPix || '' };
}

export function MeuPerfilPage() {
  useLocale();
  const { atualizarPerfil } = useAuth();
  const [perfil, setPerfil] = useState<Entregador | null>(null);
  const [form, setForm] = useState<ReturnType<typeof draft> | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get<Entregador>('/operacao-entregador/perfil').then(({ data }) => { setPerfil(data); setForm(draft(data)); })
      .catch(reason => setError(apiErrorMessage(reason, message('entregador.perfil.perfil.indisponivel'))));
  }, []);

  if (!perfil || !form) return <main className="page profilePage"><div className={`asyncState ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>{error || message('entregador.perfil.carregando.seu.perfil')}</div></main>;
  const changed = JSON.stringify(form) !== JSON.stringify(draft(perfil));
  const phoneValid = onlyDigits(form.telefone).length >= 10;
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm({ ...form, [key]: value }); setError(''); setFeedback('');
  };
  return (
    <main className="page profilePage">
      <header className="profilePageIntro"><div><span className="profileEyebrow">{message('entregador.perfil.conta.do.entregador')}</span><h1>{message('entregador.perfil.meu.perfil')}</h1><p>{message('conta.edicao.descricao.entregador')}</p></div>
        <span className={`profileAvailability ${perfil.disponivel ? 'isAvailable' : ''}`}><span />{message(perfil.disponivel ? 'entregador.perfil.disponivel.para.entregas' : 'entregador.perfil.indisponivel.no.momento')}</span></header>
      <section className="panelCard profileIdentityCard"><div className="profileAvatar" aria-hidden="true">{perfil.nome.split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase()}</div>
        <div className="profileIdentityText"><div className="profileRole"><BadgeCheck size={15} />{message('entregador.perfil.entregador')}</div><h2>{titleCase(perfil.nome)}</h2><p><Mail size={16} />{perfil.email}</p></div></section>
      <form className="accountEditForm" onSubmit={async event => {
        event.preventDefault(); if (busy || !changed || !phoneValid) return;
        setBusy(true); setError(''); setFeedback('');
        try {
          const { data } = await api.patch<Entregador>('/operacao-entregador/perfil', {
            ...form, nome: form.nome.trim(), email: formatEmailInput(form.email), telefone: onlyDigits(form.telefone),
            placaVeiculo: normalizeVehiclePlate(form.placaVeiculo), tipoChavePix: form.tipoChavePix || null,
            chavePix: form.tipoChavePix ? form.chavePix.trim() : '', titularPix: form.tipoChavePix ? form.titularPix.trim() : '',
          }, { headers: { 'If-Match': perfil.versao } });
          setPerfil(data); setForm(draft(data)); atualizarPerfil({ nome: data.nome, email: data.email || form.email });
          setFeedback(message('conta.edicao.salvo'));
        } catch (reason) { setError(apiErrorMessage(reason, message('conta.edicao.erro'))); }
        finally { setBusy(false); }
      }}>
        <div className="profileContentGrid">
          <section className="panelCard accountSection" aria-labelledby="account-contact-title">
            <div className="accountSectionHeader"><span><UserRound size={20} /></span><div><h2 id="account-contact-title">{message('conta.edicao.dados.contato')}</h2><p>{message('conta.edicao.contato.descricao')}</p></div></div>
            <div className="accountFields">
              <label className="accountWide">{message('conta.edicao.nome')}<input required name="nome" autoComplete="name" maxLength={140} value={form.nome} onChange={e => setField('nome', e.target.value)} /></label>
              <div className="accountField accountWide"><label htmlFor="profile-email">{message('conta.edicao.email')}</label><input id="profile-email" aria-describedby="profile-email-help" required type="email" name="email" autoComplete="email" maxLength={180} value={form.email} onChange={e => setField('email', formatEmailInput(e.target.value))} /><small id="profile-email-help">{message('conta.edicao.email.descricao')}</small></div>
              <label className="accountWide">{message('conta.edicao.telefone')}<input required type="tel" name="telefone" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.telefone} aria-invalid={!!form.telefone && !phoneValid} onChange={e => setField('telefone', formatPhone(e.target.value))} /></label>
              {form.telefone && !phoneValid ? <p className="accountWide fieldError" role="alert">{message('entregador.perfil.informe.o.ddd.e.um.telefone.valido')}</p> : null}
            </div>
          </section>
          <section className="panelCard accountSection" aria-labelledby="account-operation-title">
            <div className="accountSectionHeader"><span><Bike size={20} /></span><div><h2 id="account-operation-title">{message('conta.edicao.veiculo.pix')}</h2><p>{message('conta.edicao.operacao.descricao')}</p></div></div>
            <div className="accountFields">
              <div className="accountField accountWide"><label htmlFor="profile-plate">{message('conta.edicao.placa')}</label><input id="profile-plate" aria-describedby="profile-plate-help" name="placaVeiculo" autoComplete="off" maxLength={8} placeholder="ABC-1D23" value={form.placaVeiculo} onChange={e => setField('placaVeiculo', formatVehiclePlate(e.target.value))} /><small id="profile-plate-help">{domainLabel(perfil.tipoVeiculo)}</small></div>
              <label className="accountWide">{message('conta.edicao.tipo.pix')}<select value={form.tipoChavePix} onChange={e => { setForm({ ...form, tipoChavePix: e.target.value as TipoChavePix | '', chavePix: '', titularPix: form.titularPix }); setFeedback(''); setError(''); }}>
                <option value="">{message('entregadores.ainda.nao.configurado')}</option>{(['CPF', 'EMAIL', 'TELEFONE', 'ALEATORIA'] as const).map(type => <option key={type} value={type}>{domainLabel(type)}</option>)}
              </select></label>
              <label className="accountWide">{message('conta.edicao.chave.pix')}<input name="chavePix" disabled={!form.tipoChavePix} required={!!form.tipoChavePix} type={form.tipoChavePix === 'EMAIL' ? 'email' : 'text'} inputMode={form.tipoChavePix === 'CPF' ? 'numeric' : form.tipoChavePix === 'TELEFONE' ? 'tel' : 'text'} maxLength={180} value={form.tipoChavePix ? form.chavePix : ''} onChange={e => setField('chavePix', form.tipoChavePix === 'CPF' ? formatCpf(e.target.value) : form.tipoChavePix === 'EMAIL' ? formatEmailInput(e.target.value) : e.target.value)} /></label>
              <label className="accountWide">{message('conta.edicao.titular.pix')}<input name="titularPix" disabled={!form.tipoChavePix} required={!!form.tipoChavePix} maxLength={140} value={form.tipoChavePix ? form.titularPix : ''} onChange={e => setField('titularPix', e.target.value)} /></label>
              <p className="accountWide accountHint"><WalletCards size={17} />{message('conta.edicao.pix.descricao')}</p>
            </div>
          </section>
        </div>
        <div className="accountSaveBar"><span>{message('conta.edicao.salvamento.direto')}</span><button className="primaryButton" disabled={busy || !changed || !phoneValid}><Save size={17} />{message(busy ? 'comum.salvando' : 'conta.edicao.salvar')}</button></div>
        {error ? <p className="profileMessage error" role="alert"><CircleAlert size={18} />{error}</p> : null}
        {feedback ? <p className="profileMessage success" role="status"><BadgeCheck size={18} />{feedback}</p> : null}
      </form>
      <div className="panelCard profileSecurityCard"><SegurancaConta /></div>
    </main>
  );
}
