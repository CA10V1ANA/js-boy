import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { UsuarioSistema } from '../types';

export function UsuariosPage() {
  const [items, setItems] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState<UsuarioSistema | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems((await api.get<UsuarioSistema[]>('/usuarios')).data);
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel carregar os usuarios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggle() {
    if (!pending || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.patch(`/usuarios/${pending.id}/status`, { ativo: !pending.ativo });
      setSuccess(pending.ativo ? 'Usuario desativado.' : 'Usuario ativado.');
      setPending(null);
      await load();
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel alterar o usuario.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="pageHeader"><div><h1>Usuarios</h1><p>Acessos vinculados aos perfis reais da operacao.</p></div></div>
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {loading ? <LoadingState label="Carregando usuarios..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="Nenhum usuario cadastrado" /> : null}
      {!loading && !error ? (
        <section className="responsiveList">
          {items.map((item) => (
            <article className="userCard" key={item.id}>
              <div><strong>{item.nome}</strong><span>{item.email}</span></div>
              <span className={`statusBadge ${item.ativo ? 'active' : ''}`}>{item.ativo ? 'Ativo' : 'Inativo'}</span>
              <dl><div><dt>Perfil</dt><dd>{item.perfil}</dd></div><div><dt>Vinculo</dt><dd>{item.vinculo || 'Proprietario'}</dd></div></dl>
              <button className="secondaryButton" type="button" onClick={() => setPending(item)}>
                {item.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </article>
          ))}
        </section>
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        title={`${pending?.ativo ? 'Desativar' : 'Ativar'} usuario?`}
        description="A mudanca afeta o proximo acesso desta conta."
        confirmLabel={pending?.ativo ? 'Desativar' : 'Ativar'}
        danger={pending?.ativo}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void toggle()}
      />
    </main>
  );
}
