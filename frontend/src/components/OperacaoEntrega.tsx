import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { getStoredUser } from '../services/authStorage';
import { clearReceiptIntent, createReceiptIntent, pendingReceipt, PendingReceipt } from '../services/financialIntent';
import { Parada, Recebimento } from '../types';
import { ConfirmDialog } from './AsyncState';

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function OperacaoEntrega({ entregaId, versao, perfil = 'CLIENTE', onChange }: {
  entregaId: string; versao?: number; perfil?: 'CLIENTE' | 'ENTREGADOR' | 'PROPRIETARIO'; onChange?: () => void;
}) {
  const [financeiro, setFinanceiro] = useState<Recebimento | null>(null);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [valor, setValor] = useState('');
  const [transacaoLegada, setTransacaoLegada] = useState('');
  const [ocorrencia, setOcorrencia] = useState({ paradaId: '', motivo: '', proximaAcao: '' });
  const [occurrenceOpen, setOccurrenceOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [conclusao, setConclusao] = useState({ recebedorNome: '', observacao: '' });
  const intent = useRef<PendingReceipt | null>(null);
  const sending = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [financial, route] = await Promise.all([
        api.get<Recebimento>(`/recebimentos/entregas/${entregaId}`),
        api.get<Parada[]>(`/rotas/entregas/${entregaId}`),
      ]);
      setFinanceiro(financial.data);
      setParadas(route.data);
      setValor(String(intent.current ? intent.current.payload.valor : financial.data.saldo));
      setTransacaoLegada(financial.data.transacaoLegadaId ? String(financial.data.transacaoLegadaId) : '');
    } catch (reason) {
      setFinanceiro(null);
      setError(apiErrorMessage(reason, 'Não foi possível conferir rota e pagamento. A finalização permanece bloqueada.'));
    } finally { setLoading(false); }
  }, [entregaId]);
  useEffect(() => {
    const user = getStoredUser();
    intent.current = user && perfil !== 'CLIENTE' ? pendingReceipt(user.id, entregaId) : null;
    void load();
  }, [load, versao, perfil, entregaId]);

  async function confirmar() {
    if (!financeiro || sending.current) return;
    if (!intent.current && (!Number.isFinite(Number(valor)) || Number(valor) <= 0 || Number(valor) > financeiro.saldo)) {
      setError('Informe um valor positivo até o saldo pendente.'); return;
    }
    try {
      const user = getStoredUser();
      if (!user) throw new Error('Sessão não identificada. Entre novamente antes de confirmar.');
      if (!intent.current) {
        if (financeiro.formaPagamento !== 'PIX' && financeiro.formaPagamento !== 'DINHEIRO') return;
        intent.current = createReceiptIntent(user.id, entregaId, {
          valor: Number(valor), formaPagamento: financeiro.formaPagamento, referenciaRecebedor: financeiro.referenciaRecebedor,
        });
      }
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Não foi possível preservar a confirmação. Habilite o armazenamento do navegador e tente novamente.'));
      return;
    }
    sending.current = true; setBusy(true); setError(''); setFeedback('');
    try {
      await api.post(`/recebimentos/entregas/${entregaId}/confirmar`, intent.current.payload,
        { headers: { 'Idempotency-Key': intent.current.chave } });
      clearReceiptIntent(entregaId);
      intent.current = null;
      await load();
      onChange?.();
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Recebimento ainda não confirmado nesta tela. Atualize os dados ou repita a confirmação.'));
      setFinanceiro(null);
    } finally { sending.current = false; setBusy(false); }
  }

  async function copiarChave() {
    if (!financeiro || busy) return;
    setBusy(true); setError(''); setFeedback('');
    let atual: Recebimento;
    try {
      atual = (await api.get<Recebimento>(`/recebimentos/entregas/${entregaId}`)).data;
      setFinanceiro(atual);
      if (atual.referenciaRecebedor !== financeiro.referenciaRecebedor || !atual.chavePix) {
        setError('Os dados de pagamento mudaram. Confira o recebedor atualizado antes de copiar.');
        setBusy(false); return;
      }
    } catch (reason) {
      setFinanceiro(null); setBusy(false);
      setError(apiErrorMessage(reason, 'Não foi possível conferir a chave atual. Atualize os dados antes de pagar.')); return;
    }
    try {
      await navigator.clipboard.writeText(atual.chavePix!);
      setFeedback('Chave copiada. O recebimento será confirmado manualmente após a conferência do crédito.');
    } catch { setError('Não foi possível copiar. Selecione a chave e copie manualmente.'); }
    finally { setBusy(false); }
  }

  async function conciliarLegado() {
    if (!financeiro?.cobrancaLegadaId || sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      await api.post(`/api/pix/${financeiro.cobrancaLegadaId}/conciliar`, { transacaoId: Number(transacaoLegada) });
      await load(); onChange?.();
    } catch (reason) { setError(apiErrorMessage(reason, 'Não foi possível conciliar a cobrança legada.')); }
    finally { sending.current = false; setBusy(false); }
  }

  async function concluir(parada: Parada) {
    if (sending.current) return;
    const recebedorNome = conclusao.recebedorNome.trim();
    if (parada.tipo === 'ENTREGA' && !recebedorNome) { setError('Informe quem recebeu a entrega.'); return; }
    sending.current = true; setBusy(true); setError('');
    try {
      await api.post(`/rotas/entregas/${entregaId}/paradas/${parada.id}/concluir`, {
        recebedorNome: parada.tipo === 'ENTREGA' ? recebedorNome : null,
        observacao: conclusao.observacao.trim() || null,
      }, { headers: { 'If-Match': String(parada.versao) } });
      setConclusao({ recebedorNome: '', observacao: '' });
      await load(); onChange?.();
    } catch (reason) { setError(apiErrorMessage(reason, 'Não foi possível concluir a parada.')); }
    finally { sending.current = false; setBusy(false); }
  }

  async function finalizar() {
    if (!financeiro?.podeFinalizar || sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      const path = perfil === 'ENTREGADOR' ? `/entregas/minhas-entregas/${entregaId}/status` : `/entregas/${entregaId}/status`;
      await api.patch(path, { status: 'ENTREGUE' }, { headers: { 'If-Match': String(versao) } });
      await load(); onChange?.();
    } catch (reason) { setFinanceiro(null); setError(apiErrorMessage(reason, 'Não foi possível finalizar a entrega. Confira o estado no servidor.')); }
    finally { sending.current = false; setBusy(false); }
  }

  async function registrarOcorrencia() {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      await api.post(`/operacao-entregador/entregas/${entregaId}/ocorrencias`, {
        ...ocorrencia, paradaId: ocorrencia.paradaId || null, tipo: 'TENTATIVA_SEM_SUCESSO',
      });
      setOccurrenceOpen(false); await load(); onChange?.();
    } catch (reason) { setError(apiErrorMessage(reason, 'Não foi possível registrar a ocorrência.')); }
    finally { sending.current = false; setBusy(false); }
  }

  const proxima = paradas.find(p => p.status !== 'CONCLUIDA');
  return <section className="deliveryOperation" aria-label="Rota e recebimento">
    {loading ? <p role="status">Conferindo rota e pagamento...</p> : null}
    {error ? <p role="alert" className="errorMessage">{error}</p> : null}
    {feedback ? <p role="status">{feedback}</p> : null}
    <button className="secondaryButton" type="button" disabled={busy || loading} onClick={() => void load()}>Atualizar rota e pagamento</button>
    {financeiro && !loading ? <>
      {intent.current && perfil !== 'CLIENTE' ? <div className="manualReceipt">
        <p>Há uma confirmação anterior sem resposta. Confira essa tentativa antes de registrar outro recebimento.</p>
        <button className="secondaryButton" type="button" disabled={busy} onClick={() => void confirmar()}>Conferir tentativa anterior</button>
        <button className="secondaryButton" type="button" disabled={busy} onClick={() => setDiscardOpen(true)}>Descartar tentativa</button>
      </div> : null}
      <ConfirmDialog open={discardOpen} title="Descartar a tentativa anterior?"
        description="Ela pode já ter sido registrada. Confira o valor recebido no financeiro antes de descartar. Isso não estorna nenhum valor."
        confirmLabel="Descartar tentativa" danger busy={busy} onCancel={() => setDiscardOpen(false)}
        onConfirm={() => { clearReceiptIntent(entregaId); intent.current = null; setDiscardOpen(false); void load(); }} />
      <div className="paymentSummary">
        <strong>{financeiro.formaPagamento === 'PIX' ? 'Pix direto' : financeiro.formaPagamento === 'DINHEIRO' ? 'Dinheiro' : 'Pagamento legado'}</strong>
        <p>{financeiro.recebidoConfirmado
          ? financeiro.valorRecebido === 0 ? 'Sem saldo pendente' : financeiro.formaPagamento === 'PIX' ? 'Pix recebido' : 'Recebimento regularizado'
          : financeiro.formaPagamento === 'DINHEIRO' ? 'Aguardando recebimento em dinheiro' : 'Aguardando confirmação'}</p>
        <p>Recebedor: {financeiro.recebedorNome || 'Entregador ainda não designado'}</p>
        <p>Recebido: {money(financeiro.valorRecebido)} · Saldo: {money(financeiro.saldo)}</p>
        {financeiro.confirmadoEm ? <small>Confirmado por {financeiro.confirmadoPor} em {new Date(financeiro.confirmadoEm).toLocaleString('pt-BR')}</small> : null}
        {financeiro.formaPagamento === 'PIX' && financeiro.saldo > 0 ? financeiro.chavePix ? <>
          <p>Titular: {financeiro.titularPix}</p>
          <code className="pixKey">{financeiro.chavePix}</code>
          <button type="button" className="secondaryButton" disabled={busy} onClick={() => void copiarChave()}>Copiar chave Pix</button>
          <small>Confira o destinatário no seu banco antes de pagar. Copiar a chave não confirma recebimento.</small>
        </> : <p>Cadastre a chave Pix do entregador designado para apresentar o pagamento.</p> : null}
        {financeiro.cobrancaLegadaId && perfil === 'PROPRIETARIO' ? <div className="manualReceipt">
          <p>Existe uma cobrança anterior pendente. Confira a transação no Mercado Pago antes de receber novamente.</p>
          <label>ID da transação antiga<input inputMode="numeric" value={transacaoLegada} onChange={e => setTransacaoLegada(e.target.value.replace(/\D/g, ''))} /></label>
          <button className="secondaryButton" type="button" disabled={busy || !transacaoLegada} onClick={() => void conciliarLegado()}>Consultar e conciliar cobrança antiga</button>
          <small>A consulta não emite cobrança. Sem ID conhecido, localize a transação na conta do provedor; a pendência permanece até confirmação.</small>
        </div> : null}
        {financeiro.podeConfirmar && perfil !== 'CLIENTE' ? <div className="manualReceipt">
          <label>Valor conferido na conta ou recebido em dinheiro
            <input type="number" min="0.01" max={financeiro.saldo} step="0.01" value={valor}
              disabled={busy || !!intent.current} onChange={event => setValor(event.target.value)} />
          </label>
          <button className="primaryButton" type="button" disabled={busy} onClick={() => void confirmar()}>
            {busy ? 'Confirmando...' : financeiro.formaPagamento === 'PIX' ? 'Confirmar Pix recebido' : 'Confirmar dinheiro recebido'}
          </button>
        </div> : null}
      </div>
      <ol className="routeCards">
        {paradas.map(parada => <li key={parada.id} className={proxima?.id === parada.id ? 'nextStop' : ''}>
          <strong>{parada.ordem}. {parada.tipo === 'COLETA' ? 'Coleta' : 'Entrega'}{proxima?.id === parada.id ? ' · Próxima parada' : ''}</strong>
          <p>{parada.endereco}{parada.complemento ? ` · ${parada.complemento}` : ''}</p>
          <p>{[parada.cidade, parada.estado, parada.cep].filter(Boolean).join(' · ')}</p>
          {parada.contatoNome ? <p>{parada.contatoNome} · {parada.contatoTelefone}</p> : null}
          {parada.observacao ? <p>{parada.observacao}</p> : null}
          <small>{parada.status === 'CONCLUIDA' ? `Concluída em ${new Date(parada.realizadaEm!).toLocaleString('pt-BR')}${parada.usuarioConclusaoNome ? ` por ${parada.usuarioConclusaoNome}` : ''}` : parada.status === 'FALHOU' ? 'Tentativa falhou; parada pendente de resolução' : 'Pendente'}</small>
          {parada.recebedorNome ? <p>Recebido por {parada.recebedorNome}</p> : null}
          {parada.observacaoConclusao ? <p>Observação: {parada.observacaoConclusao}</p> : null}
          {perfil !== 'CLIENTE' && proxima?.id === parada.id && !financeiro.pendencia?.startsWith('Entrega encerrada') ?
            <div className="settingsForm stopConclusion">
              {parada.tipo === 'ENTREGA' ? <label>Quem recebeu
                <input id={`recebedor-${parada.id}`} maxLength={140} required value={conclusao.recebedorNome}
                  placeholder={parada.contatoNome || 'Nome de quem recebeu'}
                  onChange={e => setConclusao({ ...conclusao, recebedorNome: e.target.value })} />
              </label> : null}
              <label>Observação <small>(opcional)</small>
                <textarea id={`observacao-${parada.id}`} rows={2} maxLength={500} value={conclusao.observacao}
                  onChange={e => setConclusao({ ...conclusao, observacao: e.target.value })} />
              </label>
              <button className="secondaryButton" type="button" disabled={busy || (parada.tipo === 'ENTREGA' && !conclusao.recebedorNome.trim())}
                onClick={() => void concluir(parada)}>
                {parada.tipo === 'COLETA' ? 'Confirmar coleta' : 'Concluir parada'}
              </button>
            </div> : null}
        </li>)}
      </ol>
      {paradas.length === 0 ? <p>Rota ainda não cadastrada. Procure o proprietário.</p> : null}
      <p role="status">{financeiro.pendencia || (financeiro.podeFinalizar ? 'Entrega pronta para finalizar' : 'Siga as etapas operacionais para finalizar')}</p>
      {perfil !== 'CLIENTE' ? <button className="darkButton" type="button" disabled={busy || !financeiro.podeFinalizar} onClick={() => void finalizar()}>Finalizar entrega</button> : null}
      {perfil === 'ENTREGADOR' && proxima ? <>
        <button className="secondaryButton" type="button" disabled={busy} onClick={() => setOccurrenceOpen(!occurrenceOpen)}>Registrar tentativa frustrada</button>
        {occurrenceOpen ? <div className="settingsForm">
          <label>Local<select value={ocorrencia.paradaId} onChange={e => setOcorrencia({ ...ocorrencia, paradaId: e.target.value })}><option value="">Entrega inteira</option>{paradas.map(p => <option key={p.id} value={p.id}>{p.ordem}. {p.endereco}</option>)}</select></label>
          <label>Motivo<input maxLength={180} value={ocorrencia.motivo} onChange={e => setOcorrencia({ ...ocorrencia, motivo: e.target.value })} /></label>
          <label>Próxima ação<input maxLength={300} value={ocorrencia.proximaAcao} onChange={e => setOcorrencia({ ...ocorrencia, proximaAcao: e.target.value })} /></label>
          <button type="button" className="secondaryButton" disabled={busy || !ocorrencia.motivo.trim() || !ocorrencia.proximaAcao.trim()} onClick={() => void registrarOcorrencia()}>Registrar ocorrência</button>
        </div> : null}
      </> : null}
    </> : null}
  </section>;
}
