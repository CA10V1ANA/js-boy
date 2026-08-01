import { KeyRound, ToggleLeft, ToggleRight, UserCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { TableActions } from '../components/TableActions';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { UsuarioSistema } from '../types';
import { sentenceCase, titleCase } from '../utils/display';

export function UsuariosPage() {
  const [items, setItems] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState<UsuarioSistema | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems((await api.get<UsuarioSistema[]>('/usuarios')).data); }
    catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel carregar os usuarios.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function toggle() {
    if (!pending || busy) return;
    setBusy(true); setError('');
    try {
      await api.patch(`/usuarios/${pending.id}/status`, { ativo: !pending.ativo });
      setSuccess(pending.ativo ? 'Usuario desativado.' : 'Usuario ativado.'); setPending(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, 'Nao foi possivel alterar o usuario.')); }
    finally { setBusy(false); }
  }

  return (
    <main className="page">
      <div className="pageHeader"><div><h1>Usuarios</h1><p>Acessos vinculados aos perfis reais da operacao.</p></div></div>
      <section className="infoBanner"><span className="infoBannerIcon"><KeyRound size={20} /></span><div><strong>Senhas permanecem protegidas</strong><p>Por seguranca, o sistema exibe apenas uma representacao mascarada. Nenhuma senha verdadeira pode ser consultada, nem pelo proprietario.</p></div></section>
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {loading ? <LoadingState label="Carregando usuarios..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="Nenhum usuario cadastrado" /> : null}
      {!loading && !error && items.length > 0 ? (
        <section className="adminList"><div className="tableWrap"><table className="responsiveTable"><thead><tr><th>Usuario</th><th>Status</th><th>Perfil</th><th>Vinculo</th><th>Senha</th><th style={{ textAlign: 'right' }}>Acoes</th></tr></thead><tbody>
          {items.map((item) => <tr key={item.id}>
            <td data-label="Usuario"><div className="nameCell"><span className="avatarTile"><UserCog size={16} /></span><div><div>{titleCase(item.nome)}</div><div className="cellSub">{item.email.toLowerCase()}</div></div></div></td>
            <td data-label="Status"><span className={`statusBadge ${item.ativo ? 'active' : 'danger'}`}>{item.ativo ? 'Ativo' : 'Inativo'}</span></td>
            <td data-label="Perfil">{sentenceCase(item.perfil)}</td>
            <td data-label="Vinculo">{sentenceCase(item.vinculo || 'PROPRIETARIO')}</td>
            <td data-label="Senha"><span className="passwordMask" title="Senha protegida">••••••••</span></td>
            <td data-label="Acoes"><TableActions actions={[{ label: item.ativo ? 'Desativar usuario' : 'Ativar usuario', icon: item.ativo ? <ToggleLeft size={16} /> : <ToggleRight size={16} />, onClick: () => setPending(item), danger: item.ativo }]} /></td>
          </tr>)}
        </tbody></table></div></section>
      ) : null}
      <ConfirmDialog open={pending !== null} title={`${pending?.ativo ? 'Desativar' : 'Ativar'} usuario?`} description="A mudanca afeta o proximo acesso desta conta." confirmLabel={pending?.ativo ? 'Desativar' : 'Ativar'} danger={pending?.ativo} busy={busy} onCancel={() => setPending(null)} onConfirm={() => void toggle()} />
    </main>
  );
}