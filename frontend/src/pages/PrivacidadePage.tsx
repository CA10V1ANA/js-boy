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
      .catch(() => { setFeedbackTone('error'); setFeedback('Não foi possível carregar os clientes.'); })
      .finally(() => setLoadingClients(false));
  }, []);

  async function exportar(event?: FormEvent) {
    event?.preventDefault(); if (!clienteId) return; setBusy(true); setFeedback('');
    try {
      const response = await api.get(`/lgpd/clientes/${clienteId}/exportacao`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'dados-do-cliente.json'; link.click(); URL.revokeObjectURL(url);
      setFeedbackTone('success'); setFeedback('Exportação gerada e registrada para entrega segura ao titular.');
    } catch (reason) { setFeedbackTone('error'); setFeedback(apiErrorMessage(reason, 'Não foi possível exportar.')); }
    finally { setBusy(false); }
  }

  async function anonimizar() {
    setBusy(true); setFeedback('');
    try { await api.post(`/lgpd/clientes/${clienteId}/anonimizacao`, null, { params: { justificativa } }); setFeedbackTone('success'); setFeedback('Cliente anonimizado. Registros financeiros foram preservados.'); setConfirm(false); setClienteId(''); setJustificativa(''); }
    catch (reason) { setFeedbackTone('error'); setFeedback(apiErrorMessage(reason, 'Não foi possível anonimizar.')); }
    finally { setBusy(false); }
  }

  return <main className="page">
    <div className="pageHeader"><div><h1>Privacidade</h1><p>Atenda solicitações de dados pessoais conforme a LGPD.</p></div></div>
    <section className="infoBanner"><span className="infoBannerIcon"><ShieldCheck size={20} /></span><div><strong>O que você pode fazer aqui?</strong><p>Exportar os dados de um cliente para entrega ao titular ou anonimizar seus dados quando houver uma solicitação válida. Registros financeiros obrigatórios são preservados.</p></div></section>
    {feedback ? <FeedbackMessage tone={feedbackTone}>{feedback}</FeedbackMessage> : null}
    <section className="panelCard privacyPanel">
      <div className="privacyIdentity"><span className="panelIcon"><Info size={18} /></span><div><h2>Identifique a solicitação</h2><p>Confirme a identidade do titular antes de executar qualquer ação.</p></div></div>
      {loadingClients ? <p>Carregando clientes...</p> : clientes.length === 0 ? (
        <div className="emptyState">
          <UserPlus size={24} />
          <strong>Nenhum cliente cadastrado</strong>
          <span>Cadastre um cliente para habilitar a exportação e as demais ações de privacidade.</span>
          <Link className="secondaryButton" to="/clientes">Cadastrar cliente</Link>
        </div>
      ) : (
        <div className="privacyFields"><label>Cliente<select required value={clienteId} onChange={(event) => setClienteId(event.target.value)}><option value="">Selecione o cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{titleCase(cliente.nome)} · {formatPhone(cliente.telefone)}</option>)}</select></label><label>Justificativa<input placeholder="Informe o motivo e a base da solicitação" value={justificativa} onChange={(event) => setJustificativa(event.target.value)} /></label></div>
      )}
    </section>
    <section className="adminList privacyActionsList"><div className="tableWrap"><table className="responsiveTable"><thead><tr><th>Solicitação</th><th>O que acontece</th><th>Requisito</th><th style={{ textAlign: 'right' }}>Ação</th></tr></thead><tbody>
      <tr><td data-label="Solicitação"><strong className="cellPrimary">Exportar dados</strong><span className="cellSub">Direito de acesso do titular</span></td><td data-label="O que acontece">Gera um arquivo JSON com os dados cadastrados.</td><td data-label="Requisito">Cliente selecionado</td><td data-label="Ação"><button className="secondaryButton" type="button" disabled={busy || !clienteId} title={!clienteId ? 'Selecione um cliente acima' : undefined} onClick={() => void exportar()}><Download size={16} /> Exportar dados</button></td></tr>
      <tr><td data-label="Solicitação"><strong className="cellPrimary">Anonimizar cliente</strong><span className="cellSub">Remoção de dados pessoais</span></td><td data-label="O que acontece">Remove dados pessoais e desativa o acesso.</td><td data-label="Requisito">Cliente e justificativa</td><td data-label="Ação"><button className="dangerButton" disabled={busy || !clienteId || !justificativa.trim()} type="button" onClick={() => setConfirm(true)}><UserRoundX size={16} /> Anonimizar</button></td></tr>
    </tbody></table></div></section>
    <ConfirmDialog open={confirm} title="Anonimizar cliente?" description="A ação remove dados pessoais e desativa o acesso. Registros financeiros permanecem." confirmLabel="Anonimizar" danger busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void anonimizar()} />
  </main>;
}
