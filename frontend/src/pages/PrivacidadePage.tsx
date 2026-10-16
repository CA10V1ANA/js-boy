import { message, useLocale } from '../i18n';
import { Download, Info, ShieldCheck, UserPlus, UserRoundX } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog, FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Cliente } from '../types';
import { titleCase } from '../utils/display';
import { formatPhone } from '../utils/inputMasks';

export function PrivacidadePage() {
  useLocale();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success');

  useEffect(() => {
    api.get<Cliente[]>('/clientes')
      .then((response) => setClientes(response.data))
      .catch(() => { setFeedbackTone('error'); setFeedback(message("privacidade.nao.foi.possivel.carregar.os.clientes")); })
      .finally(() => setLoadingClients(false));
  }, []);

  async function exportar(event?: FormEvent) {
    event?.preventDefault(); if (!clienteId) return; setBusy(true); setFeedback('');
    try {
      const response = await api.get(`/lgpd/clientes/${clienteId}/exportacao`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'dados-do-cliente.json'; link.click(); URL.revokeObjectURL(url);
      setFeedbackTone('success'); setFeedback(message("privacidade.exportacao.gerada.e.registrada.para.entrega.segura.ao.titular"));
    } catch (reason) { setFeedbackTone('error'); setFeedback(apiErrorMessage(reason, message("privacidade.nao.foi.possivel.exportar"))); }
    finally { setBusy(false); }
  }

  async function anonimizar() {
    setBusy(true); setFeedback('');
    try { await api.post(`/lgpd/clientes/${clienteId}/anonimizacao`, null, { params: { justificativa } }); setFeedbackTone('success'); setFeedback(message("privacidade.cliente.anonimizado.registros.financeiros.foram.preservados")); setConfirm(false); setClienteId(''); setJustificativa(''); }
    catch (reason) { setFeedbackTone('error'); setFeedback(apiErrorMessage(reason, message("privacidade.nao.foi.possivel.anonimizar"))); }
    finally { setBusy(false); }
  }

  return <main className="page">
    <div className="pageHeader"><div><h1>{message("privacidade.privacidade")}</h1><p>{message("privacidade.atenda.solicitacoes.de.dados.pessoais.conforme.a.lgpd")}</p></div></div>
    <section className="infoBanner"><span className="infoBannerIcon"><ShieldCheck size={20} /></span><div><strong>{message("privacidade.o.que.voce.pode.fazer.aqui")}</strong><p>{message("privacidade.exportar.os.dados.de.um.cliente.para.entrega.ao.titular.ou.anonimiza")}</p></div></section>
    {feedback ? <FeedbackMessage tone={feedbackTone}>{feedback}</FeedbackMessage> : null}
    <section className="panelCard privacyPanel">
      <div className="privacyIdentity"><span className="panelIcon"><Info size={18} /></span><div><h2>{message("privacidade.identifique.a.solicitacao")}</h2><p>{message("privacidade.confirme.a.identidade.do.titular.antes.de.executar.qualquer.acao")}</p></div></div>
      {loadingClients ? <p>{message("privacidade.carregando.clientes")}</p> : clientes.length === 0 ? (
        <div className="emptyState">
          <UserPlus size={24} />
          <strong>{message("privacidade.nenhum.cliente.cadastrado")}</strong>
          <span>{message("privacidade.cadastre.um.cliente.para.habilitar.a.exportacao.e.as.demais.acoes.de")}</span>
          <Link className="secondaryButton" to="/clientes">{message("privacidade.cadastrar.cliente")}</Link>
        </div>
      ) : (
        <div className="privacyFields"><label>{message("privacidade.cliente")}<select required value={clienteId} onChange={(event) => setClienteId(event.target.value)}><option value="">{message("privacidade.selecione.o.cliente")}</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{titleCase(cliente.nome)} · {formatPhone(cliente.telefone)}</option>)}</select></label><label>{message("privacidade.justificativa")}<input placeholder={message("privacidade.informe.o.motivo.e.a.base.da.solicitacao")} value={justificativa} onChange={(event) => setJustificativa(event.target.value)} /></label></div>
      )}
    </section>
    <section className="adminList privacyActionsList"><div className="tableWrap"><table className="responsiveTable"><thead><tr><th>{message("privacidade.solicitacao")}</th><th>{message("privacidade.o.que.acontece")}</th><th>{message("privacidade.requisito")}</th><th style={{ textAlign: 'right' }}>{message("privacidade.acao")}</th></tr></thead><tbody>
      <tr><td data-label={message("privacidade.solicitacao")}><strong className="cellPrimary">{message("privacidade.exportar.dados")}</strong><span className="cellSub">{message("privacidade.direito.de.acesso.do.titular")}</span></td><td data-label={message("privacidade.o.que.acontece")}>{message("privacidade.gera.um.arquivo.json.com.os.dados.cadastrados")}</td><td data-label={message("privacidade.requisito")}>{message("privacidade.cliente.selecionado")}</td><td data-label={message("privacidade.acao")}><button className="secondaryButton" type="button" disabled={busy || !clienteId} title={!clienteId ? message("privacidade.selecione.um.cliente.acima") : undefined} onClick={() => void exportar()}><Download size={16} /> {message("privacidade.exportar.dados")}</button></td></tr>
      <tr><td data-label={message("privacidade.solicitacao")}><strong className="cellPrimary">{message("privacidade.anonimizar.cliente")}</strong><span className="cellSub">{message("privacidade.remocao.de.dados.pessoais")}</span></td><td data-label={message("privacidade.o.que.acontece")}>{message("privacidade.remove.dados.pessoais.e.desativa.o.acesso")}</td><td data-label={message("privacidade.requisito")}>{message("privacidade.cliente.e.justificativa")}</td><td data-label={message("privacidade.acao")}><button className="dangerButton" disabled={busy || !clienteId || !justificativa.trim()} type="button" onClick={() => setConfirm(true)}><UserRoundX size={16} /> {message("privacidade.anonimizar")}</button></td></tr>
    </tbody></table></div></section>
    <ConfirmDialog open={confirm} title={message("privacidade.anonimizar.cliente.2")} description={message("privacidade.a.acao.remove.dados.pessoais.e.desativa.o.acesso.registros.financeir")} confirmLabel="Anonimizar" danger busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void anonimizar()} />
  </main>;
}
