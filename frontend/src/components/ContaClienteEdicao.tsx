import { message, useLocale } from '../i18n';
import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, CircleAlert, MapPin, Save, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import type { Cliente } from '../types';
import { GoogleLoginButton } from './GoogleLoginButton';
import { formatCep, formatCpfOrCnpj, formatEmailInput, formatPhone, onlyDigits } from '../utils/inputMasks';

function draft(cliente: Cliente) {
  return { email: cliente.email || '', telefone: formatPhone(cliente.telefone), whatsapp: formatPhone(cliente.whatsapp),
    documento: formatCpfOrCnpj(cliente.documento), cep: formatCep(cliente.cep), logradouro: cliente.logradouro || cliente.endereco,
    numero: cliente.semNumero ? '' : cliente.numero, semNumero: cliente.semNumero, complemento: cliente.complemento || '',
    bairro: cliente.bairro, cidade: cliente.cidade, estado: cliente.estado || '' };
}
export function ContaClienteEdicao({ cliente, onChange }: { cliente: Cliente; onChange: (cliente: Cliente) => void }) {
  useLocale();
  const { atualizarPerfil } = useAuth();
  const [form, setForm] = useState(() => draft(cliente));
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [emailAtivo, setEmailAtivo] = useState(true);
  useEffect(() => { setForm(draft(cliente)); }, [cliente]);
  useEffect(() => {
    api.get<{ emailAtivo: boolean }>('/cliente/notificacoes/preferencias').then(({ data }) => setEmailAtivo(data.emailAtivo))
      .catch(reason => setError(apiErrorMessage(reason, message('cliente.conta.nao.foi.possivel.consultar.preferencias'))));
  }, []);
  const changed = JSON.stringify(form) !== JSON.stringify(draft(cliente));
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => { setForm({ ...form, [key]: value }); setError(''); setFeedback(''); };
  return (
    <section className="accountEditor">
      <form className="accountEditForm" onSubmit={async event => {
        event.preventDefault(); if (busy || !changed) return;
        setBusy(true); setError(''); setFeedback('');
        try {
          const { data } = await api.patch<Cliente>('/cliente/me', { ...form, email: formatEmailInput(form.email),
            telefone: onlyDigits(form.telefone), whatsapp: onlyDigits(form.whatsapp), documento: onlyDigits(form.documento), cep: onlyDigits(form.cep),
          }, { headers: { 'If-Match': cliente.versao } });
          setForm(draft(data)); onChange(data); atualizarPerfil({ nome: data.nome, email: data.email || form.email });
          setFeedback(message('conta.edicao.salvo'));
        } catch (reason) { setError(apiErrorMessage(reason, message('conta.edicao.erro'))); }
        finally { setBusy(false); }
      }}>
        <section className="accountSection" aria-labelledby="customer-contact-title">
          <div className="accountSectionHeader"><span><UserRound size={20} /></span><div><h2 id="customer-contact-title">{message('conta.edicao.contato')}</h2><p>{message('conta.edicao.contato.descricao')}</p></div></div>
          <div className="accountFields">
            <div className="accountField accountWide"><label htmlFor="profile-email">{message('conta.edicao.email')}</label><input id="profile-email" aria-describedby="profile-email-help" name="email" type="email" autoComplete="email" required maxLength={180} value={form.email} onChange={e => setField('email', formatEmailInput(e.target.value))} /><small id="profile-email-help">{message('conta.edicao.email.descricao')}</small></div>
            <label>{message('conta.edicao.telefone')}<input name="telefone" type="tel" inputMode="tel" autoComplete="tel" required minLength={14} maxLength={15} placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setField('telefone', formatPhone(e.target.value))} /></label>
            <label>{message('conta.edicao.whatsapp')}<input name="whatsapp" type="tel" inputMode="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.whatsapp} onChange={e => setField('whatsapp', formatPhone(e.target.value))} /></label>
            <label className="accountWide">{message('conta.edicao.documento')}<input name="documento" inputMode="numeric" maxLength={18} value={form.documento} onChange={e => setField('documento', formatCpfOrCnpj(e.target.value))} /></label>
          </div>
        </section>
        <section className="accountSection" aria-labelledby="customer-address-title">
          <div className="accountSectionHeader"><span><MapPin size={20} /></span><div><h2 id="customer-address-title">{message('conta.edicao.endereco')}</h2><p>{message('conta.edicao.endereco.descricao')}</p></div></div>
          <div className="accountFields">
            <label>{message('conta.edicao.cep')}<input name="cep" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={form.cep} onChange={e => setField('cep', formatCep(e.target.value))} /></label>
            <label>{message('conta.edicao.estado')}<input name="estado" autoComplete="address-level1" maxLength={2} value={form.estado} onChange={e => setField('estado', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} /></label>
            <label className="accountWide">{message('conta.edicao.logradouro')}<input name="logradouro" autoComplete="street-address" required maxLength={180} value={form.logradouro} onChange={e => setField('logradouro', e.target.value)} /></label>
            <label>{message('conta.edicao.numero')}<input name="numero" required={!form.semNumero} disabled={form.semNumero} maxLength={20} value={form.semNumero ? '' : form.numero} onChange={e => setField('numero', e.target.value)} /></label>
            <label>{message('conta.edicao.complemento')}<input name="complemento" maxLength={120} value={form.complemento} onChange={e => setField('complemento', e.target.value)} /></label>
            <label className="accountCheckbox accountWide"><input type="checkbox" checked={form.semNumero} onChange={e => setField('semNumero', e.target.checked)} /><span>{message('conta.edicao.sem.numero')}</span></label>
            <label>{message('conta.edicao.bairro')}<input name="bairro" required maxLength={80} value={form.bairro} onChange={e => setField('bairro', e.target.value)} /></label>
            <label>{message('conta.edicao.cidade')}<input name="cidade" autoComplete="address-level2" required maxLength={80} value={form.cidade} onChange={e => setField('cidade', e.target.value)} /></label>
          </div>
        </section>
        <div className="accountSaveBar"><span>{message('conta.edicao.salvamento.direto')}</span><button className="primaryButton" disabled={busy || !changed}><Save size={17} />{message(busy ? 'comum.salvando' : 'conta.edicao.salvar')}</button></div>
      </form>
      {error ? <p className="profileMessage error" role="alert"><CircleAlert size={18} />{error}</p> : null}
      {feedback ? <p className="profileMessage success" role="status"><CheckCircle2 size={18} />{feedback}</p> : null}
      <section className="accountSection">
        <div className="accountSectionHeader"><span><Bell size={20} /></span><div><h2>{message('conta.edicao.preferencias')}</h2></div></div>
        <form className="accountNotificationForm" onSubmit={async event => {
          event.preventDefault(); if (busy) return; setBusy(true); setError(''); setFeedback('');
          try { await api.put('/cliente/notificacoes/preferencias', { emailAtivo, whatsappAtivo: false, smsAtivo: false }); setFeedback(message('cliente.conta.contato.e.preferencias.atualizados')); }
          catch (reason) { setError(apiErrorMessage(reason, message('conta.edicao.erro'))); }
          finally { setBusy(false); }
        }}><label className="accountCheckbox"><input type="checkbox" checked={emailAtivo} onChange={e => setEmailAtivo(e.target.checked)} /><span>{message('cliente.conta.receber.avisos.da.entrega.por.e.mail')}</span></label><button className="secondaryButton" disabled={busy}>{message('conta.edicao.salvar.preferencias')}</button></form>
      </section>
      <h2>{message("cliente.conta.vincular.google")}</h2>
      <GoogleLoginButton
        onCredential={(credencial) => {
          if (busy) return;
          setBusy(true);
          void api
            .post("/conta/google", { credencial })
            .then(() => setFeedback(message("cliente.conta.google.vinculado.a.sua.conta")))
            .catch((r) =>
              setFeedback(
                apiErrorMessage(r, message("cliente.conta.nao.foi.possivel.vincular.google")),
              ),
            )
            .finally(() => setBusy(false));
        }}
      />
      <p>
        {message("conta.edicao.privacidade.descricao")} </p>
      <h2>{message("cliente.conta.privacidade")}</h2>
      <button
        type="button"
        className="secondaryButton"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await api.get("/cliente/privacidade/exportar");
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(r.data, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "js-boy-meus-dados.json";
            a.click();
            URL.revokeObjectURL(url);
          } catch (e) {
            setFeedback(apiErrorMessage(e, message("cliente.conta.nao.foi.possivel.exportar")));
          } finally {
            setBusy(false);
          }
        }}
      >
        {message("cliente.conta.exportar.meus.dados")} </button>
      <form
        className="settingsForm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await api.post("/cliente/privacidade/solicitacoes", {
              tipo: "ANONIMIZACAO",
              justificativa,
            });
            setFeedback(
              message("cliente.conta.pedido.registrado.para.analise.da.js.boy.os.historicos.financeiros.s"),
            );
            setJustificativa("");
          } catch (r) {
            setFeedback(
              apiErrorMessage(r, message("cliente.conta.nao.foi.possivel.registrar.o.pedido")),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {message("cliente.conta.motivo.do.pedido.de.anonimizacao")} <textarea
            required
            maxLength={500}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
          />
        </label>
        <button className="secondaryButton" disabled={busy}>
          {message("cliente.conta.solicitar.analise.de.anonimizacao")} </button>
      </form>
    </section>
  );
}
