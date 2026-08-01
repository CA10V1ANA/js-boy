import { Download, Info, ShieldCheck, UserRoundX } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ConfirmDialog, FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Cliente } from '../types';
import { titleCase } from '../utils/display';
import { formatPhone } from '../utils/inputMasks';

export function PrivacidadePage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get<Cliente[]>('/clientes').then((response) => setClientes(response.data)).catch(() => setFeedback('Nao foi possivel carregar os clientes.')); }, []);

  async function exportar(event?: FormEvent) {
    event?.preventDefault(); if (!clienteId) return; setBusy(true); setFeedback('');
    try {
      const response = await api.get(`/lgpd/clientes/${clienteId}/exportacao`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'dados-do-cliente.json'; link.click(); URL.revokeObjectURL(url);
      setFeedback('Exportacao gerada e registrada para entrega segura ao titular.');
    } catch (reason) { setFeedback(apiErrorMessage(reason, 'Nao foi possivel exportar.')); }
    finally { setBusy(false); }
  }

  async function anonimizar() {
    setBusy(true); setFeedback('');
    try { await api.post(`/lgpd/clientes/${clienteId}/anonimizacao`, null, { params: { justificativa } }); setFeedback('Cliente anonimizado. Registros financeiros foram preservados.'); setConfirm(false); setClienteId(''); setJustificativa(''); }
    catch (reason) { setFeedback(apiErrorMessage(reason, 'Nao foi possivel anonimizar.')); }
    finally { setBusy(false); }
  }

  return <main className="page">
    <div className="pageHeader"><div><h1>Privacidade</h1><p>Atenda solicitacoes de dados pessoais conforme a LGPD.</p></div></div>
    <section className="infoBanner"><span className="infoBannerIcon"><ShieldCheck size={20} /></span><div><strong>O que voce pode fazer aqui?</strong><p>Exportar os dados de um cliente para entrega ao titular ou anonimizar seus dados quando houver uma solicitacao valida. Registros financeiros obrigatorios sao preservados.</p></div></section>
    {feedback ? <FeedbackMessage tone={feedback.startsWith('Nao') ? 'error' : 'success'}>{feedback}</FeedbackMessage> : null}
    <section className="panelCard privacyPanel">
      <div className="privacyIdentity"><span className="panelIcon"><Info size={18} /></span><div><h2>Identifique a solicitacao</h2><p>Confirme a identidade do titular antes de executar qualquer acao.</p></div></div>
      <div className="privacyFields"><label>Cliente<select required value={clienteId} onChange={(event) => setClienteId(event.target.value)}><option value="">Selecione o cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{titleCase(cliente.nome)} · {formatPhone(cliente.telefone)}</option>)}</select></label><label>Justificativa<input placeholder="Informe o motivo e a base da solicitacao" value={justificativa} onChange={(event) => setJustificativa(event.target.value)} /></label></div>
    </section>
    <section className="adminList privacyActionsList"><div className="tableWrap"><table className="responsiveTable"><thead><tr><th>Solicitacao</th><th>O que acontece</th><th>Requisito</th><th style={{ textAlign: 'right' }}>Acao</th></tr></thead><tbody>
      <tr><td data-label="Solicitacao"><strong className="cellPrimary">Exportar dados</strong><span className="cellSub">Direito de acesso do titular</span></td><td data-label="O que acontece">Gera um arquivo JSON com os dados cadastrados.</td><td data-label="Requisito">Cliente selecionado</td><td data-label="Acao"><button className="secondaryButton" type="button" disabled={busy || !clienteId} onClick={() => void exportar()}><Download size={16} /> Exportar</button></td></tr>
      <tr><td data-label="Solicitacao"><strong className="cellPrimary">Anonimizar cliente</strong><span className="cellSub">Remocao de dados pessoais</span></td><td data-label="O que acontece">Remove dados pessoais e desativa o acesso.</td><td data-label="Requisito">Cliente e justificativa</td><td data-label="Acao"><button className="dangerButton" disabled={busy || !clienteId || !justificativa.trim()} type="button" onClick={() => setConfirm(true)}><UserRoundX size={16} /> Anonimizar</button></td></tr>
    </tbody></table></div></section>
    <ConfirmDialog open={confirm} title="Anonimizar cliente?" description="A acao remove dados pessoais e desativa o acesso. Registros financeiros permanecem." confirmLabel="Anonimizar" danger busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void anonimizar()} />
  </main>;
}