import { FormEvent, useState } from 'react';
import { ConfirmDialog, FeedbackMessage } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';

export function PrivacidadePage() {
  const [clienteId, setClienteId] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function exportar(event: FormEvent) {
    event.preventDefault(); setBusy(true); setFeedback('');
    try {
      const response = await api.get(`/lgpd/clientes/${clienteId}/exportacao`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `cliente-${clienteId}.json`; link.click();
      URL.revokeObjectURL(url);
      setFeedback('Exportação gerada e registrada para entrega segura ao titular.');
    } catch (reason) { setFeedback(apiErrorMessage(reason, 'Não foi possível exportar.')); }
    finally { setBusy(false); }
  }

  async function anonimizar() {
    setBusy(true); setFeedback('');
    try {
      await api.post(`/lgpd/clientes/${clienteId}/anonimizacao`, null, { params: { justificativa } });
      setFeedback('Cliente anonimizado. Registros financeiros foram preservados.');
      setConfirm(false);
    } catch (reason) { setFeedback(apiErrorMessage(reason, 'Não foi possível anonimizar.')); }
    finally { setBusy(false); }
  }

  return (
    <main className="page">
      <section className="panelCard">
        <div className="panelCardHeader"><div><span className="modalEyebrow">LGPD</span><h2>Solicitações do titular</h2></div></div>
        <p>Confirme a identidade e a base de retenção antes de entregar ou anonimizar dados.</p>
        {feedback ? <FeedbackMessage tone={feedback.startsWith('Não') ? 'error' : 'success'}>{feedback}</FeedbackMessage> : null}
        <form className="requestGrid" onSubmit={exportar}>
          <label>ID do cliente<input required value={clienteId} onChange={(e) => setClienteId(e.target.value)} /></label>
          <label>Justificativa<input value={justificativa} onChange={(e) => setJustificativa(e.target.value)} /></label>
          <button className="secondaryButton" disabled={busy} type="submit">Exportar JSON</button>
          <button className="dangerButton" disabled={busy || !clienteId || !justificativa} type="button" onClick={() => setConfirm(true)}>Anonimizar</button>
        </form>
      </section>
      <ConfirmDialog open={confirm} title="Anonimizar cliente?" description="A ação remove dados pessoais e desativa o acesso. Registros financeiros permanecem." confirmLabel="Anonimizar" danger busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void anonimizar()} />
    </main>
  );
}
