import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';

type Pix = {
  id: string; valor: number; status: string;
  qrCodeBase64: string | null; qrCodeCopiaECola: string | null; expiraEm: string;
};

export function PixPagamento({ entregaId }: { entregaId: string }) {
  const [pix, setPix] = useState<Pix | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pixId = pix?.id;
  const status = pix?.status;
  useEffect(() => {
    if (!pixId || status !== 'PENDENTE') return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await api.get<Pix>(`/api/pix/${pixId}`);
        if (active) setPix(response.data);
      } catch {
        if (active) setMessage('Não foi possível consultar a confirmação. Tentaremos novamente.');
      }
      if (active) timer = setTimeout(() => void poll(), 8000);
    }
    timer = setTimeout(() => void poll(), 8000);
    return () => { active = false; clearTimeout(timer); };
  }, [pixId, status]);

  async function gerar() {
    setBusy(true); setMessage('');
    try { setPix((await api.post<Pix>(`/api/pix/entregas/${entregaId}`)).data); }
    catch (reason) { setMessage(apiErrorMessage(reason, 'Não foi possível gerar o Pix.')); }
    finally { setBusy(false); }
  }
  async function copiar() {
    if (!pix?.qrCodeCopiaECola) return;
    try {
      await navigator.clipboard.writeText(pix.qrCodeCopiaECola);
      setMessage('Código Pix copiado.');
    } catch { setMessage('Não foi possível copiar. Selecione o código abaixo e copie manualmente.'); }
  }
  const expirado = pix && new Date(pix.expiraEm).getTime() < Date.now();
  return <section aria-label="Pagamento por Pix" className="settingsForm">
    <button type="button" className="secondaryButton" disabled={busy} onClick={() => void gerar()}>
      {busy ? 'Gerando Pix...' : pix ? 'Recuperar cobrança Pix' : 'Gerar cobrança Pix'}
    </button>
    {pix ? <>
      <p role="status">{pix.status === 'PAGO' ? 'Pagamento confirmado.' : `Pix: ${pix.status}`} · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pix.valor)}</p>
      {pix.status === 'PENDENTE' && !expirado ? <>
        <p>Válido até {new Date(pix.expiraEm).toLocaleString('pt-BR')}. A confirmação é automática.</p>
        {pix.qrCodeBase64 ? <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code para pagamento Pix" width={240} height={240} style={{ maxWidth: '100%', objectFit: 'contain' }} /> : null}
        {pix.qrCodeCopiaECola ? <>
          <label>Pix Copia e Cola<textarea readOnly value={pix.qrCodeCopiaECola} onFocus={e => e.currentTarget.select()} /></label>
          <button type="button" className="primaryButton" onClick={() => void copiar()}>Copiar código Pix</button>
        </> : null}
      </> : null}
      {pix.status === 'PENDENTE' && expirado ? <p>Prazo do QR Code encerrado. Consulte o responsável financeiro.</p> : null}
    </> : null}
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
