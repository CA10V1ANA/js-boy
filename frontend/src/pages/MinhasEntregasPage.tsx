import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Entrega, StatusEntrega } from '../types';

function labelStatus(status: StatusEntrega) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}
function next(status: StatusEntrega): { status: StatusEntrega; label: string } | null {
  if (status === 'ENTREGADOR_DESIGNADO') return { status: 'COLETADA', label: 'Confirmar coleta' };
  if (status === 'COLETADA') return { status: 'EM_ROTA', label: 'Iniciar rota' };
  if (status === 'EM_ROTA') return { status: 'ENTREGUE', label: 'Confirmar entrega' };
  return null;
}

export function MinhasEntregasPage() {
  const [items, setItems] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState<Entrega | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems((await api.get<Entrega[]>('/entregas/minhas-entregas')).data);
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel carregar suas entregas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function advance() {
    const action = pending ? next(pending.status) : null;
    if (!pending || !action || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.patch(`/entregas/minhas-entregas/${pending.id}/status`, { status: action.status }, {
        headers: { 'If-Match': String(pending.versao) },
      });
      setSuccess(`${action.label} registrada.`);
      setPending(null);
      await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel atualizar esta entrega.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {loading ? <LoadingState label="Carregando suas entregas..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="Nenhuma entrega designada" description="Novas entregas aparecerao aqui quando forem designadas a voce." />
      ) : null}
      {!loading && !error ? (
        <section className="deliveryCards" aria-label="Minhas entregas">
          {items.map((delivery) => {
            const action = next(delivery.status);
            return (
              <article className="deliveryCard" key={delivery.id}>
                <div><span>{delivery.codigo}</span><strong>{delivery.destinatarioNome}</strong><p>{delivery.enderecoDestino}, {delivery.bairroDestino}</p></div>
                <dl>
                  <div><dt>Cliente</dt><dd>{delivery.clienteNome}</dd></div>
                  <div><dt>Coleta</dt><dd>{delivery.enderecoOrigem}, {delivery.bairroOrigem}</dd></div>
                  <div><dt>Destinatario</dt><dd>{delivery.destinatarioTelefone}</dd></div>
                  <div><dt>Mercadoria</dt><dd>{delivery.descricaoMercadoria}</dd></div>
                  <div><dt>Status</dt><dd><span className={`statusBadge ${delivery.status === 'ENTREGUE' ? 'active' : ''}`}>{labelStatus(delivery.status)}</span></dd></div>
                </dl>
                {delivery.historico?.length ? (
                  <details><summary>Historico</summary><ol>{delivery.historico.map((entry, index) => (
                    <li key={`${entry.alteradoEm}-${index}`}>{labelStatus(entry.novoStatus)} · {new Date(entry.alteradoEm).toLocaleString('pt-BR')}</li>
                  ))}</ol></details>
                ) : null}
                {action ? <button className="primaryButton" type="button" onClick={() => setPending(delivery)}>{action.label}</button> : null}
              </article>
            );
          })}
        </section>
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        title={`${pending ? next(pending.status)?.label : 'Atualizar entrega'}?`}
        description="Confirme somente depois de concluir esta etapa da operacao."
        confirmLabel={pending ? next(pending.status)?.label : 'Confirmar'}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void advance()}
      />
    </main>
  );
}
